from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Q

from catalog.models import ProviderProfile


class Review(models.Model):
    class Status(models.TextChoices):
        PUBLISHED = "PUBLISHED", "Publicada"
        PENDING = "PENDING", "Pendiente"
        HIDDEN = "HIDDEN", "Oculta"

    class Source(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        PUBLIC = "PUBLIC", "Público"

    provider = models.ForeignKey(ProviderProfile, related_name="reviews", on_delete=models.CASCADE)

    # ✅ ahora puede ser null (reseña pública)
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="reviews_written",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    # ✅ datos del público (cuando reviewer=None)
    reviewer_name = models.CharField(max_length=120, blank=True, default="")
    reviewer_email = models.EmailField(blank=True, default="")
    reviewer_phone = models.CharField(max_length=50, blank=True, default="")
    reviewer_org = models.CharField(max_length=140, blank=True, default="")  # consorcio / empresa (opcional)

    source = models.CharField(max_length=20, choices=Source.choices, default=Source.ADMIN)

    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True, default="")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)
        constraints = [
            # 1 review por admin por proveedor (solo cuando reviewer NO es null)
            models.UniqueConstraint(
                fields=["provider", "reviewer"],
                name="uniq_review_per_provider_reviewer",
                condition=Q(reviewer__isnull=False),
            ),
            # 1 review por email por proveedor (solo cuando reviewer ES null y email no vacío)
            models.UniqueConstraint(
                fields=["provider", "reviewer_email"],
                name="uniq_review_per_provider_email",
                condition=Q(reviewer__isnull=True) & ~Q(reviewer_email=""),
            ),
        ]
        indexes = [
            models.Index(fields=["provider", "status", "created_at"], name="rev_prov_status_created_idx"),
            models.Index(fields=["status", "created_at"], name="rev_status_created_idx"),
        ]

    def __str__(self):
        who = self.reviewer.email if self.reviewer_id else (self.reviewer_email or self.reviewer_name or "public")
        return f"{self.provider} - {self.rating}★ ({self.status}) [{who}]"
