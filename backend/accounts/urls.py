from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import RegisterAdminView, RegisterProviderView, MeView

urlpatterns = [
    path("register-admin/", RegisterAdminView.as_view()),
    path("register-provider/", RegisterProviderView.as_view()),

    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    path("me/", MeView.as_view()),
]
