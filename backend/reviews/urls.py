from django.urls import path
from .views import ProviderReviewUpsertView

urlpatterns = [
    path("providers/<slug:slug>/", ProviderReviewUpsertView.as_view()),
]
