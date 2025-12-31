from django.db.models import Avg, Count

from catalog.models import ProviderProfile
from .models import Review


def recompute_provider_stats(provider_id: int, m: int = 5) -> None:
    """
    Actualiza rating_avg, rating_count y ranking_score (bayesiano) del proveedor.
    Solo toma reviews PUBLISHED.
    """
    qs_provider = Review.objects.filter(provider_id=provider_id, status=Review.Status.PUBLISHED)
    agg = qs_provider.aggregate(avg=Avg("rating"), cnt=Count("id"))
    R = float(agg["avg"] or 0.0)
    v = int(agg["cnt"] or 0)

    qs_global = Review.objects.filter(status=Review.Status.PUBLISHED)
    g = qs_global.aggregate(avg=Avg("rating"), cnt=Count("id"))
    C = float(g["avg"] or 0.0)

    score = 0.0
    if v + m > 0:
        score = (v / (v + m)) * R + (m / (v + m)) * C

    ProviderProfile.objects.filter(pk=provider_id).update(
        rating_avg=R,
        rating_count=v,
        ranking_score=score,
    )
