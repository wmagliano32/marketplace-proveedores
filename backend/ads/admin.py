from datetime import timedelta

from django.contrib import admin, messages
from django.urls import path, reverse
from django.http import HttpResponseRedirect
from django.utils import timezone
from django.utils.html import format_html

from .models import AdBanner, AdRequest


@admin.register(AdBanner)
class AdBannerAdmin(admin.ModelAdmin):
    list_display = ("id", "placement", "creative_type", "animation", "sponsor_name", "active", "weight", "impressions", "clicks", "updated_at")
    list_filter = ("placement", "creative_type", "animation", "active")
    search_fields = ("sponsor_name", "title", "subtitle", "link_url")


@admin.register(AdRequest)
class AdRequestAdmin(admin.ModelAdmin):
    list_display = ("id", "placement", "sponsor_name", "contact_email", "status", "duration_months", "created_banner", "created_at")
    list_filter = ("placement", "status", "duration_months")
    search_fields = ("sponsor_name", "contact_name", "contact_email", "link_url")
    readonly_fields = ("created_banner", "create_banner_button")
    actions = ["action_create_banner"]

    fieldsets = (
        ("Solicitud", {
            "fields": ("placement", "status", "duration_months", "created_banner", "create_banner_button")
        }),
        ("Contacto", {
            "fields": ("sponsor_name", "contact_name", "contact_email", "contact_phone", "link_url")
        }),
        ("Creativo", {
            "fields": ("creative_type", "animation", "title", "subtitle", "cta_text",
                      "background_color", "text_color", "font_family", "font_size", "logo", "image", "notes")
        }),
    )

    def get_urls(self):
        urls = super().get_urls()
        custom = [
            path(
                "<int:request_id>/create-banner/",
                self.admin_site.admin_view(self.create_banner_view),
                name="ads_adrequest_create_banner",
            ),
        ]
        return custom + urls

    def create_banner_button(self, obj: AdRequest):
        if not obj or obj.pk is None:
            return "-"
        if obj.created_banner_id:
            url = reverse("admin:ads_adbanner_change", args=[obj.created_banner_id])
            return format_html('<a class="button" href="{}">Ver banner</a>', url)

        url = reverse("admin:ads_adrequest_create_banner", args=[obj.pk])
        return format_html('<a class="button" href="{}">Crear banner</a>', url)

    create_banner_button.short_description = "Acción"

    def _create_banner_from_request(self, req: AdRequest) -> AdBanner:
        if req.created_banner_id:
            return req.created_banner

        now = timezone.now()
        ends = now + timedelta(days=30 * int(req.duration_months or 1))

        banner = AdBanner.objects.create(
            placement=req.placement,
            creative_type=req.creative_type,
            animation=req.animation,
            sponsor_name=req.sponsor_name,
            title=req.title,
            subtitle=req.subtitle,
            cta_text=req.cta_text,
            background_color=req.background_color,
            text_color=req.text_color,
            font_family=req.font_family or AdBanner._meta.get_field("font_family").default,
            font_size=req.font_size,
            link_url=req.link_url,
            active=False,          # ✅ lo crea desactivado para revisar
            weight=1,
            starts_at=now,
            ends_at=ends,
        )

        # Copiar archivos (logo/imagen)
        if req.logo:
            banner.logo = req.logo
        if req.image:
            banner.image = req.image
        banner.save()

        req.created_banner = banner
        req.status = AdRequest.Status.APPROVED
        req.save(update_fields=["created_banner", "status"])

        return banner

    def create_banner_view(self, request, request_id: int):
        req = AdRequest.objects.get(pk=request_id)
        banner = self._create_banner_from_request(req)

        messages.success(request, f"Banner creado (ID {banner.id}). Revisá y activalo.")
        return HttpResponseRedirect(reverse("admin:ads_adbanner_change", args=[banner.id]))

    def action_create_banner(self, request, queryset):
        created = 0
        for req in queryset:
            if not req.created_banner_id:
                self._create_banner_from_request(req)
                created += 1
        self.message_user(request, f"Listo. Banners creados: {created}", level=messages.SUCCESS)

    action_create_banner.short_description = "Crear banner desde solicitud (seleccionadas)"
