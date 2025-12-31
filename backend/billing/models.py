from django.db import models

from catalog.models import ProviderProfile


class Plan(models.Model):
    """
    code: BASIC_MONTHLY / BASIC_YEARLY / SILVER_MONTHLY / ...
    tier: 1 basic, 2 silver, 3 gold
    interval_months: 1 (mensual) o 12 (anual)
    """
    code = models.CharField(max_length=40, unique=True)
    name = models.CharField(max_length=120)
    tier = models.PositiveSmallIntegerField(default=1)
    interval_months = models.PositiveSmallIntegerField(default=1)
    price_cents = models.PositiveIntegerField(default=0)
    currency = models.CharField(max_length=10, default="ARS")
    active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.code} - {self.name}"


class Subscription(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pendiente"
        ACTIVE = "ACTIVE", "Activa"
        CANCELED = "CANCELED", "Cancelada"
        EXPIRED = "EXPIRED", "Vencida"

    class Gateway(models.TextChoices):
        MANUAL = "MANUAL", "Manual"
        MP = "MP", "Mercado Pago"

    provider = models.ForeignKey(ProviderProfile, related_name="subscriptions", on_delete=models.CASCADE)
    plan = models.ForeignKey(Plan, related_name="subscriptions", on_delete=models.PROTECT)

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)

    current_period_start = models.DateTimeField(null=True, blank=True)
    current_period_end = models.DateTimeField(null=True, blank=True)

    auto_renew = models.BooleanField(default=True)
    gateway = models.CharField(max_length=20, choices=Gateway.choices, default=Gateway.MANUAL)
    gateway_subscription_id = models.CharField(max_length=120, blank=True, default="")

    gateway_checkout_url = models.URLField(blank=True, default="")
    gateway_status = models.CharField(max_length=40, blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["provider", "status", "current_period_end"], name="sub_prov_status_end_idx"),
            models.Index(fields=["gateway", "gateway_subscription_id"], name="sub_gateway_subid_idx"),
        ]

    def __str__(self):
        return f"{self.provider} / {self.plan.code} ({self.status})"
