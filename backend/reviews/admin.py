from django.contrib import admin
from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("id", "provider", "reviewer", "rating", "status", "created_at")
    list_filter = ("status", "rating")
    search_fields = ("provider__slug", "provider__nombre_fantasia", "reviewer__email", "comment")
    autocomplete_fields = ("provider", "reviewer")
