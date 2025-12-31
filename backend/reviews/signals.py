from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from .models import Review
from .services import recompute_provider_stats


@receiver(post_save, sender=Review)
def review_saved(sender, instance: Review, **kwargs):
    recompute_provider_stats(instance.provider_id)


@receiver(post_delete, sender=Review)
def review_deleted(sender, instance: Review, **kwargs):
    recompute_provider_stats(instance.provider_id)
