from django.db import models
from django.utils import timezone


class AdBanner(models.Model):
    class Placement(models.TextChoices):
        HEADER = "HEADER", "Header"
        FOOTER = "FOOTER", "Footer"
        LEFT_RAIL = "LEFT_RAIL", "Left rail"
        RIGHT_RAIL = "RIGHT_RAIL", "Right rail"

    class CreativeType(models.TextChoices):
        IMAGE = "IMAGE", "Imagen"
        COMPOSED = "COMPOSED", "Banner con texto (logo + copy)"

    class Animation(models.TextChoices):
        NONE = "NONE", "Sin animación"
        PULSE = "PULSE", "Pulso suave"
        FLOAT = "FLOAT", "Logo flotando"

    placement = models.CharField(max_length=20, choices=Placement.choices, db_index=True)

    creative_type = models.CharField(max_length=20, choices=CreativeType.choices, default=CreativeType.COMPOSED)
    animation = models.CharField(max_length=20, choices=Animation.choices, default=Animation.NONE)

    sponsor_name = models.CharField(max_length=120, blank=True, default="")
    title = models.CharField(max_length=140, blank=True, default="")
    subtitle = models.CharField(max_length=180, blank=True, default="")
    cta_text = models.CharField(max_length=40, blank=True, default="Conocé más")

    background_color = models.CharField(max_length=20, blank=True, default="#0f172a")
    text_color = models.CharField(max_length=20, blank=True, default="#ffffff")
    font_family = models.CharField(
        max_length=120,
        blank=True,
        default="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
    )
    font_size = models.PositiveSmallIntegerField(default=16)

    logo = models.ImageField(upload_to="ads/logos/", null=True, blank=True)
    image = models.ImageField(upload_to="ads/images/", null=True, blank=True)
    image_url = models.URLField(blank=True, default="")

    link_url = models.URLField(blank=True, default="")

    active = models.BooleanField(default=True, db_index=True)
    weight = models.PositiveSmallIntegerField(default=1)

    starts_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)

    impressions = models.PositiveIntegerField(default=0)
    clicks = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["placement", "active"], name="ad_place_active_idx"),
            models.Index(fields=["starts_at", "ends_at"], name="ad_dates_idx"),
        ]
        ordering = ("placement", "-weight", "-updated_at")

    def is_running(self):
        now = timezone.now()
        if not self.active:
            return False
        if self.starts_at and self.starts_at > now:
            return False
        if self.ends_at and self.ends_at < now:
            return False
        return True

    def __str__(self):
        return f"{self.placement} - {self.sponsor_name or self.title or self.id}"


class AdRequest(models.Model):
    class Placement(models.TextChoices):
        HEADER = "HEADER", "Header"
        FOOTER = "FOOTER", "Footer"
        LEFT_RAIL = "LEFT_RAIL", "Left rail"
        RIGHT_RAIL = "RIGHT_RAIL", "Right rail"

    class CreativeType(models.TextChoices):
        IMAGE = "IMAGE", "Imagen"
        COMPOSED = "COMPOSED", "Banner con texto"

    class Animation(models.TextChoices):
        NONE = "NONE", "Sin animación"
        PULSE = "PULSE", "Pulso suave"
        FLOAT = "FLOAT", "Logo flotando"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pendiente"
        APPROVED = "APPROVED", "Aprobada"
        REJECTED = "REJECTED", "Rechazada"

    placement = models.CharField(max_length=20, choices=Placement.choices)

    sponsor_name = models.CharField(max_length=120)
    contact_name = models.CharField(max_length=120)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=50, blank=True, default="")

    link_url = models.URLField(blank=True, default="")

    creative_type = models.CharField(max_length=20, choices=CreativeType.choices, default=CreativeType.IMAGE)
    animation = models.CharField(max_length=20, choices=Animation.choices, default=Animation.NONE)

    title = models.CharField(max_length=140, blank=True, default="")
    subtitle = models.CharField(max_length=180, blank=True, default="")
    cta_text = models.CharField(max_length=40, blank=True, default="Conocé más")

    background_color = models.CharField(max_length=20, blank=True, default="#0f172a")
    text_color = models.CharField(max_length=20, blank=True, default="#ffffff")
    font_family = models.CharField(max_length=120, blank=True, default="")
    font_size = models.PositiveSmallIntegerField(default=16)

    logo = models.ImageField(upload_to="ads/requests/logos/", null=True, blank=True)
    image = models.ImageField(upload_to="ads/requests/images/", null=True, blank=True)

    duration_months = models.PositiveSmallIntegerField(default=1)

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    notes = models.TextField(blank=True, default="")

    # ✅ link al banner creado (evita duplicados)
    created_banner = models.ForeignKey(
        AdBanner,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="source_requests",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["placement", "status"], name="adreq_place_status_idx"),
            models.Index(fields=["created_at"], name="adreq_created_idx"),
        ]

    def __str__(self):
        return f"REQ {self.placement} - {self.sponsor_name} ({self.status})"
