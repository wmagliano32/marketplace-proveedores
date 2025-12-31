import random
from django.core.cache import cache
from django.db.models import F, Q
from django.http import HttpResponseRedirect, HttpResponseNotFound
from django.utils import timezone

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AdBanner
from .serializers import PublicAdSerializer

SLOT_TTL_SECONDS = 60
EMPTY_SENTINEL = "__EMPTY__"


class PublicAdSlotView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        placement = (request.query_params.get("placement") or "").strip().upper()
        allowed = {"HEADER", "FOOTER", "LEFT_RAIL", "RIGHT_RAIL"}
        if placement not in allowed:
            return Response({"detail": "placement must be HEADER|FOOTER|LEFT_RAIL|RIGHT_RAIL"}, status=400)

        ck = f"public:adslot:{placement}"
        cached = cache.get(ck)
        if cached is not None:
            if cached == EMPTY_SENTINEL:
                return Response({"ad": None})
            return Response({"ad": cached})

        now = timezone.now()
        qs = (
            AdBanner.objects.filter(placement=placement, active=True)
            .filter(Q(starts_at__isnull=True) | Q(starts_at__lte=now))
            .filter(Q(ends_at__isnull=True) | Q(ends_at__gte=now))
            .order_by("-weight", "-updated_at")[:50]
        )
        ads = list(qs)
        if not ads:
            cache.set(ck, EMPTY_SENTINEL, SLOT_TTL_SECONDS)
            return Response({"ad": None})

        ad = random.choices(ads, weights=[max(1, a.weight) for a in ads], k=1)[0]
        payload = PublicAdSerializer(ad, context={"request": request}).data
        cache.set(ck, payload, SLOT_TTL_SECONDS)
        return Response({"ad": payload})


class PublicAdImpressionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, pk: int):
        AdBanner.objects.filter(pk=pk).update(impressions=F("impressions") + 1)
        return Response({"ok": True})


class PublicAdClickView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk: int):
        ad = AdBanner.objects.filter(pk=pk, active=True).first()
        if not ad or not ad.link_url:
            return HttpResponseNotFound()
        AdBanner.objects.filter(pk=pk).update(clicks=F("clicks") + 1)
        return HttpResponseRedirect(ad.link_url)
