from datetime import timedelta
from django.utils import timezone
from django.db.models import Q, Max

from catalog.models import ProviderProfile
from .models import Subscription


def apply_provider_visibility_from_subscriptions(provider_id: int) -> None:
    now = timezone.now()

    active_qs = Subscription.objects.filter(
        provider_id=provider_id,
        status=Subscription.Status.ACTIVE,
    ).filter(
        Q(current_period_end__isnull=True) | Q(current_period_end__gte=now)
    ).select_related("plan")

    if not active_qs.exists():
        ProviderProfile.objects.filter(pk=provider_id).update(
            is_visible=False,
            is_featured=False,
            plan_tier=0,
            plan_code="",
        )
        return

    # mayor tier activo
    max_tier = active_qs.aggregate(m=Max("plan__tier"))["m"] or 1

    # plan_code: el de mayor tier (si hay varios, el más reciente)
    best = active_qs.filter(plan__tier=max_tier).order_by("-current_period_end", "-created_at").first()
    plan_code = best.plan.code if best else ""

    ProviderProfile.objects.filter(pk=provider_id).update(
        is_visible=True,
        plan_tier=max_tier,
        plan_code=plan_code,
        is_featured=(max_tier >= 2),  # silver/gold “destacados”
    )
