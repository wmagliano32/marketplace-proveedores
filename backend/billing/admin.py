from django.contrib import admin
from .models import Plan, Subscription


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "tier", "interval_months", "price_cents", "currency", "active")
    list_filter = ("active", "tier", "interval_months", "currency")
    search_fields = ("code", "name")


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ("id", "provider", "plan", "status", "current_period_end", "gateway", "created_at")
    list_filter = ("status", "plan__tier", "plan__interval_months", "gateway")
    search_fields = ("provider__slug", "provider__nombre_fantasia", "provider__user__email", "gateway_subscription_id")
    autocomplete_fields = ("provider", "plan")
