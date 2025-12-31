from django.contrib import admin
from .models import Category, Subcategory, ProviderProfile


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "active")
    list_filter = ("active",)
    search_fields = ("name", "slug")


@admin.register(Subcategory)
class SubcategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "category", "active")
    list_filter = ("active", "category")
    search_fields = ("name", "slug", "category__name")


@admin.register(ProviderProfile)
class ProviderProfileAdmin(admin.ModelAdmin):
    list_display = ("__str__", "slug", "is_visible", "is_featured", "rating_avg", "rating_count", "updated_at")
    list_filter = ("is_visible", "is_featured", "subcategories__category")
    search_fields = ("nombre_fantasia", "razon_social", "slug", "user__email")
    filter_horizontal = ("subcategories",)
