from django.conf import settings
from django.db import models
from slugify import slugify


class Category(models.Model):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=140, unique=True, blank=True)
    active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Rubro"
        verbose_name_plural = "Rubros"
        ordering = ("name",)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Subcategory(models.Model):
    category = models.ForeignKey(Category, related_name="subcategories", on_delete=models.CASCADE)
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=180, unique=True, blank=True)
    active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Subrubro"
        verbose_name_plural = "Subrubros"
        ordering = ("category__name", "name")
        constraints = [
            models.UniqueConstraint(fields=["category", "name"], name="uniq_subcategory_name_per_category")
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            base = f"{self.category.slug or slugify(self.category.name)}-{self.name}"
            self.slug = slugify(base)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.category.name} / {self.name}"


class ProviderProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, related_name="provider_profile", on_delete=models.CASCADE)
    slug = models.SlugField(max_length=200, unique=True, blank=True)

    nombre_fantasia = models.CharField(max_length=140, blank=True, default="")
    razon_social = models.CharField(max_length=180, blank=True, default="")
    cuit = models.CharField(max_length=20, blank=True, default="")

    descripcion = models.TextField(blank=True, default="")

    telefono = models.CharField(max_length=50, blank=True, default="")
    whatsapp = models.CharField(max_length=50, blank=True, default="")
    email_publico = models.EmailField(blank=True, default="")
    website = models.URLField(blank=True, default="")

    province = models.CharField(max_length=80, blank=True, default="")
    city = models.CharField(max_length=80, blank=True, default="")
    address = models.CharField(max_length=200, blank=True, default="")

    subcategories = models.ManyToManyField(Subcategory, related_name="providers", blank=True)

    # visibilidad
    is_visible = models.BooleanField(default=False)

    # badges/posicionamiento
    plan_tier = models.PositiveSmallIntegerField(default=0)  # 0 none, 1 basic, 2 silver, 3 gold
    plan_code = models.CharField(max_length=40, blank=True, default="")  # e.g. BASIC_MONTHLY

    # compat UI: destacamos silver/gold
    is_featured = models.BooleanField(default=False)

    rating_avg = models.FloatField(default=0)
    rating_count = models.PositiveIntegerField(default=0)
    ranking_score = models.FloatField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Proveedor"
        verbose_name_plural = "Proveedores"
        ordering = ("-plan_tier", "-ranking_score", "-rating_avg", "-rating_count", "nombre_fantasia")
        indexes = [
            models.Index(fields=["is_visible", "plan_tier", "ranking_score"], name="prov_vis_tier_score_idx"),
            models.Index(fields=["is_visible", "province", "city"], name="prov_vis_prov_city_idx"),
        ]

    def _base_slug(self):
        base = self.nombre_fantasia or self.razon_social
        if not base:
            base = self.user.email.split("@")[0] if self.user_id else "proveedor"
        return slugify(base)

    def save(self, *args, **kwargs):
        if not self.slug:
            base = self._base_slug()
            candidate = base
            i = 2
            while ProviderProfile.objects.filter(slug=candidate).exclude(pk=self.pk).exists():
                candidate = f"{base}-{i}"
                i += 1
            self.slug = candidate
        super().save(*args, **kwargs)

    def __str__(self):
        return self.nombre_fantasia or self.razon_social or self.user.email
