from rest_framework import serializers
from .models import Plan, Subscription


class PlanPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = ("code", "name", "tier", "interval_months", "price_cents", "currency")


class SubscriptionSerializer(serializers.ModelSerializer):
    plan_code = serializers.CharField(source="plan.code", read_only=True)
    plan_name = serializers.CharField(source="plan.name", read_only=True)
    tier = serializers.IntegerField(source="plan.tier", read_only=True)
    interval_months = serializers.IntegerField(source="plan.interval_months", read_only=True)

    class Meta:
        model = Subscription
        fields = (
            "id",
            "plan_code",
            "plan_name",
            "tier",
            "interval_months",
            "status",
            "current_period_start",
            "current_period_end",
            "auto_renew",
            "gateway",
            "gateway_checkout_url",
            "gateway_status",
            "created_at",
        )


class SubscriptionStartSerializer(serializers.Serializer):
    plan_code = serializers.CharField()
