from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import ProviderProfile

User = get_user_model()


@receiver(post_save, sender=User)
def create_provider_profile(sender, instance, created, **kwargs):
    if not created:
        return
    if getattr(instance, "role", None) == User.Role.PROVIDER:
        ProviderProfile.objects.create(user=instance)
