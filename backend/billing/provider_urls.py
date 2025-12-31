from django.urls import path
from .views import ProviderSubscriptionListView, ProviderSubscriptionStartView

urlpatterns = [
    path("subscriptions/", ProviderSubscriptionListView.as_view()),
    path("subscriptions/start/", ProviderSubscriptionStartView.as_view()),
]
