from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from .models import Subscription
from .services import apply_provider_visibility_from_subscriptions


@receiver(post_save, sender=Subscription)
def subscription_saved(sender, instance: Subscription, **kwargs):
    apply_provider_visibility_from_subscriptions(instance.provider_id)


@receiver(post_delete, sender=Subscription)
def subscription_deleted(sender, instance: Subscription, **kwargs):
    apply_provider_visibility_from_subscriptions(instance.provider_id)
