from rest_framework import serializers
from .models import Category, Subcategory, ProviderProfile


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug")


class SubcategoryMiniSerializer(serializers.ModelSerializer):
    category_slug = serializers.CharField(source="category.slug", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Subcategory
        fields = ("id", "name", "slug", "category_slug", "category_name")


class SubcategorySerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)

    class Meta:
        model = Subcategory
        fields = ("id", "name", "slug", "active", "category")


class ProviderPublicListSerializer(serializers.ModelSerializer):
    subcategories = SubcategoryMiniSerializer(many=True, read_only=True)

    class Meta:
        model = ProviderProfile
        fields = (
            "id",
            "slug",
            "nombre_fantasia",
            "razon_social",
            "descripcion",
            "province",
            "city",
            "plan_tier",
            "plan_code",
            "is_featured",
            "ranking_score",
            "rating_avg",
            "rating_count",
            "subcategories",
        )


class ProviderPublicDetailSerializer(serializers.ModelSerializer):
    subcategories = SubcategoryMiniSerializer(many=True, read_only=True)

    class Meta:
        model = ProviderProfile
        fields = (
            "id",
            "slug",
            "nombre_fantasia",
            "razon_social",
            "cuit",
            "descripcion",
            "telefono",
            "whatsapp",
            "email_publico",
            "website",
            "province",
            "city",
            "address",
            "plan_tier",
            "plan_code",
            "is_featured",
            "ranking_score",
            "rating_avg",
            "rating_count",
            "subcategories",
        )


class ProviderProfileMeSerializer(serializers.ModelSerializer):
    subcategories = SubcategoryMiniSerializer(many=True, read_only=True)
    subcategory_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Subcategory.objects.filter(active=True),
        write_only=True,
        required=False,
        source="subcategories",
    )

    class Meta:
        model = ProviderProfile
        fields = (
            "id",
            "slug",
            "nombre_fantasia",
            "razon_social",
            "cuit",
            "descripcion",
            "telefono",
            "whatsapp",
            "email_publico",
            "website",
            "province",
            "city",
            "address",
            "subcategories",
            "subcategory_ids",
            "is_visible",
            "is_featured",
            "plan_tier",
            "plan_code",
            "rating_avg",
            "rating_count",
            "ranking_score",
        )
        read_only_fields = (
            "slug",
            "is_visible",
            "is_featured",
            "plan_tier",
            "plan_code",
            "rating_avg",
            "rating_count",
            "ranking_score",
        )
