from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from billing.webhooks import MercadoPagoWebhookView

urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/auth/", include("accounts.urls")),

    path("api/public/", include("catalog.public_urls")),
    path("api/public/", include("reviews.public_urls")),

    path("api/provider/", include("catalog.provider_urls")),
    path("api/reviews/", include("reviews.urls")),

    path("api/backoffice/", include("reviews.backoffice_urls")),

    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/public/", include("billing.public_urls")),
    path("api/provider/", include("billing.provider_urls")),
    path("api/webhooks/mercadopago/", MercadoPagoWebhookView.as_view()),
    path("api/public/", include("ads.public_urls")),

    


]
from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
