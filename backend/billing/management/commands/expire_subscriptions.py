from django.core.management.base import BaseCommand
from django.utils import timezone

from billing.models import Subscription
from billing.services import apply_provider_visibility_from_subscriptions


class Command(BaseCommand):
    help = "Marca suscripciones vencidas (ACTIVE con current_period_end < now) como EXPIRED y recalcula visibilidad."

    def handle(self, *args, **options):
        now = timezone.now()

        qs = Subscription.objects.filter(
            status=Subscription.Status.ACTIVE,
            current_period_end__isnull=False,
            current_period_end__lt=now,
        )

        provider_ids = list(qs.values_list("provider_id", flat=True).distinct())
        count = qs.update(status=Subscription.Status.EXPIRED)

        for pid in provider_ids:
            apply_provider_visibility_from_subscriptions(pid)

        self.stdout.write(self.style.SUCCESS(f"OK expire_subscriptions. expired={count} providers_updated={len(provider_ids)}"))
