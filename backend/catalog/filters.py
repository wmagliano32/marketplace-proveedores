import django_filters
from django.db.models import Exists, OuterRef

from .models import ProviderProfile


class ProviderPublicFilter(django_filters.FilterSet):
    category_slug = django_filters.CharFilter(method="filter_category")
    subcategory_slug = django_filters.CharFilter(method="filter_subcategory")
    province = django_filters.CharFilter(field_name="province", lookup_expr="iexact")
    city = django_filters.CharFilter(field_name="city", lookup_expr="iexact")
    featured = django_filters.BooleanFilter(field_name="is_featured")

    def filter_category(self, qs, name, value):
        # EXISTS sobre la tabla M2M: evita JOIN + DISTINCT
        through = ProviderProfile.subcategories.through
        subq = through.objects.filter(
            providerprofile_id=OuterRef("pk"),
            subcategory__category__slug=value,
        )
        return qs.annotate(_has_cat=Exists(subq)).filter(_has_cat=True)

    def filter_subcategory(self, qs, name, value):
        through = ProviderProfile.subcategories.through
        subq = through.objects.filter(
            providerprofile_id=OuterRef("pk"),
            subcategory__slug=value,
        )
        return qs.annotate(_has_sub=Exists(subq)).filter(_has_sub=True)

    class Meta:
        model = ProviderProfile
        fields = ["category_slug", "subcategory_slug", "province", "city", "featured"]
