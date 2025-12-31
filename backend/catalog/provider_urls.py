from django.urls import path
from .views import ProviderMeProfileView

urlpatterns = [
    path("profile/", ProviderMeProfileView.as_view()),
]
