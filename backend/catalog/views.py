import hashlib
from urllib.parse import urlencode

from django.core.cache import cache
from django.db.models import Count, Q
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .filters import ProviderPublicFilter
from .models import Category, Subcategory, ProviderProfile
from .pagination import PublicProvidersPagination
from .permissions import IsProviderRole
from .serializers import (
    CategorySerializer,
    SubcategorySerializer,
    ProviderPublicListSerializer,
    ProviderPublicDetailSerializer,
    ProviderProfileMeSerializer,
)

FACETS_TTL_SECONDS = 90
LOCATIONS_TTL_SECONDS = 300
LIST_TTL_SECONDS = 30  # listado paginado: TTL corto


def _cache_key(prefix: str, request) -> str:
    items = []
    for k, vs in request.query_params.lists():
        for v in vs:
            items.append((k, v))
    items.sort()
    raw = urlencode(items)
    digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()[:32]
    return f"{prefix}:{digest}"


def _apply_search(qs, search: str):
    if not search:
        return qs
    terms = [t for t in search.split() if t.strip()]
    for term in terms:
        qs = qs.filter(
            Q(nombre_fantasia__icontains=term)
            | Q(razon_social__icontains=term)
            | Q(descripcion__icontains=term)
            | Q(province__icontains=term)
            | Q(city__icontains=term)
        )
    return qs


def _base_visible_providers_ids(request):
    category_slug = (request.query_params.get("category_slug") or "").strip()
    subcategory_slug = (request.query_params.get("subcategory_slug") or "").strip()
    featured_raw = (request.query_params.get("featured") or "").strip().lower()
    search = (request.query_params.get("search") or "").strip()

    qs = ProviderProfile.objects.filter(is_visible=True)

    if category_slug:
        qs = qs.filter(subcategories__category__slug=category_slug)
    if subcategory_slug:
        qs = qs.filter(subcategories__slug=subcategory_slug)

    if featured_raw in ("true", "1", "yes"):
        qs = qs.filter(is_featured=True)

    qs = _apply_search(qs, search)
    return qs.values_list("id", flat=True).distinct()


# ---------- PUBLIC ----------
class PublicCategoryListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = CategorySerializer

    def get_queryset(self):
        return Category.objects.filter(active=True).order_by("name")


class PublicSubcategoryListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = SubcategorySerializer

    def get_queryset(self):
        qs = Subcategory.objects.filter(active=True, category__active=True).select_related("category")
        category_slug = self.request.query_params.get("category_slug")
        if category_slug:
            qs = qs.filter(category__slug=category_slug)
        return qs.order_by("category__name", "name")


class PublicProviderListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = ProviderPublicListSerializer
    filterset_class = ProviderPublicFilter
    search_fields = ("nombre_fantasia", "razon_social", "descripcion", "province", "city")
    ordering_fields = ("is_featured", "ranking_score", "rating_avg", "rating_count", "nombre_fantasia")
    pagination_class = PublicProvidersPagination

    def get_queryset(self):
        return (
            ProviderProfile.objects.filter(is_visible=True)
            .prefetch_related("subcategories", "subcategories__category")
            .order_by("-plan_tier", "-ranking_score", "-rating_avg", "-rating_count", "nombre_fantasia")
        )

    def list(self, request, *args, **kwargs):
        ck = _cache_key("public:providers:list:v1", request)
        cached = cache.get(ck)
        if cached is not None:
            return Response(cached)

        response = super().list(request, *args, **kwargs)
        # response.data es JSON-serializable
        cache.set(ck, response.data, LIST_TTL_SECONDS)
        return response


class PublicProviderDetailView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = ProviderPublicDetailSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return (
            ProviderProfile.objects.filter(is_visible=True)
            .prefetch_related("subcategories", "subcategories__category")
        )


class PublicRankingView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = ProviderPublicListSerializer
    filterset_class = ProviderPublicFilter
    search_fields = ("nombre_fantasia", "razon_social", "descripcion", "province", "city")
    ordering_fields = ("is_featured", "ranking_score", "rating_avg", "rating_count", "nombre_fantasia")
    pagination_class = PublicProvidersPagination

    def get_queryset(self):
        return (
            ProviderProfile.objects.filter(is_visible=True)
            .prefetch_related("subcategories", "subcategories__category")
            .order_by("-plan_tier", "-ranking_score", "-rating_avg", "-rating_count", "nombre_fantasia")
        )

    def list(self, request, *args, **kwargs):
        ck = _cache_key("public:ranking:list:v1", request)
        cached = cache.get(ck)
        if cached is not None:
            return Response(cached)

        response = super().list(request, *args, **kwargs)
        cache.set(ck, response.data, LIST_TTL_SECONDS)
        return response


class PublicLocationsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        ck = _cache_key("public:locations:v1", request)
        cached = cache.get(ck)
        if cached is not None:
            return Response(cached)

        field = (request.query_params.get("field") or "province").strip().lower()
        if field not in ("province", "city"):
            return Response({"detail": "field must be province or city"}, status=400)

        category_slug = (request.query_params.get("category_slug") or "").strip()
        subcategory_slug = (request.query_params.get("subcategory_slug") or "").strip()
        province = (request.query_params.get("province") or "").strip()
        q = (request.query_params.get("q") or "").strip()

        qs = ProviderProfile.objects.filter(is_visible=True)

        if category_slug:
            qs = qs.filter(subcategories__category__slug=category_slug)
        if subcategory_slug:
            qs = qs.filter(subcategories__slug=subcategory_slug)

        if field == "city" and province:
            qs = qs.filter(province__iexact=province)

        qs = qs.exclude(**{f"{field}__isnull": True}).exclude(**{f"{field}__exact": ""})

        if q:
            qs = qs.filter(**{f"{field}__istartswith": q})

        values = list(qs.values_list(field, flat=True).distinct().order_by(field)[:50])
        payload = {"provinces": values} if field == "province" else {"cities": values}

        cache.set(ck, payload, LOCATIONS_TTL_SECONDS)
        return Response(payload)


class PublicLocationFacetsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        ck = _cache_key("public:location-facets:v1", request)
        cached = cache.get(ck)
        if cached is not None:
            return Response(cached)

        base_ids = _base_visible_providers_ids(request)
        base = ProviderProfile.objects.filter(id__in=base_ids)

        provinces = list(
            base.exclude(province__isnull=True)
            .exclude(province__exact="")
            .values("province")
            .annotate(count=Count("id"))
            .order_by("-count", "province")[:20]
        )

        province = (request.query_params.get("province") or "").strip()
        cities_qs = base.exclude(city__isnull=True).exclude(city__exact="")
        if province:
            cities_qs = cities_qs.filter(province__iexact=province)

        cities = list(
            cities_qs.values("city")
            .annotate(count=Count("id"))
            .order_by("-count", "city")[:20]
        )

        payload = {
            "provinces": [{"value": x["province"], "count": x["count"]} for x in provinces],
            "cities": [{"value": x["city"], "count": x["count"]} for x in cities],
        }

        cache.set(ck, payload, FACETS_TTL_SECONDS)
        return Response(payload)


class PublicCatalogFacetsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        ck = _cache_key("public:catalog-facets:v1", request)
        cached = cache.get(ck)
        if cached is not None:
            return Response(cached)

        category_slug = (request.query_params.get("category_slug") or "").strip()
        subcategory_slug = (request.query_params.get("subcategory_slug") or "").strip()
        search = (request.query_params.get("search") or "").strip()
        province = (request.query_params.get("province") or "").strip()
        city = (request.query_params.get("city") or "").strip()
        featured_raw = (request.query_params.get("featured") or "").strip().lower()
        featured_filter = featured_raw in ("true", "1", "yes")

        def build_qs(*, include_category=True, include_subcategory=True, include_featured=True):
            qs = ProviderProfile.objects.filter(is_visible=True)

            if include_category and category_slug:
                qs = qs.filter(subcategories__category__slug=category_slug)
            if include_subcategory and subcategory_slug:
                qs = qs.filter(subcategories__slug=subcategory_slug)

            if province:
                qs = qs.filter(province__iexact=province)
            if city:
                qs = qs.filter(city__iexact=city)

            if include_featured and featured_filter:
                qs = qs.filter(is_featured=True)

            qs = _apply_search(qs, search)
            return qs

        qs_for_featured_count = build_qs(include_featured=False)
        featured_count = qs_for_featured_count.filter(is_featured=True).distinct().count()
        total_count = qs_for_featured_count.distinct().count()

        qs_categories = build_qs(include_category=False, include_subcategory=False, include_featured=True)
        cats = (
            Category.objects.filter(active=True, subcategories__providers__in=qs_categories)
            .annotate(count=Count("subcategories__providers", distinct=True))
            .order_by("-count", "name")[:20]
        )
        categories = [{"slug": c.slug, "name": c.name, "count": c.count} for c in cats]

        qs_sub = build_qs(include_category=True, include_subcategory=False, include_featured=True)
        subs = (
            Subcategory.objects.filter(active=True, category__active=True, providers__in=qs_sub)
            .select_related("category")
        )
        if category_slug:
            subs = subs.filter(category__slug=category_slug)

        subs = subs.annotate(count=Count("providers", distinct=True)).order_by("-count", "name")[:30]
        subcategories = [
            {
                "slug": s.slug,
                "name": s.name,
                "count": s.count,
                "category_slug": s.category.slug,
                "category_name": s.category.name,
            }
            for s in subs
        ]

        payload = {
            "total_count": total_count,
            "featured_count": featured_count,
            "categories": categories,
            "subcategories": subcategories,
        }

        cache.set(ck, payload, FACETS_TTL_SECONDS)
        return Response(payload)


# ---------- PROVIDER (PRIVATE) ----------
class ProviderMeProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, IsProviderRole]
    serializer_class = ProviderProfileMeSerializer

    def get_object(self):
        obj, _ = ProviderProfile.objects.get_or_create(user=self.request.user)
        return obj
