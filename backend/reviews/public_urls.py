from django.urls import path
from .views import PublicProviderReviewsView, PublicProviderReviewSubmitView

urlpatterns = [
    path("providers/<slug:slug>/reviews/", PublicProviderReviewsView.as_view()),
    path("providers/<slug:slug>/reviews/submit/", PublicProviderReviewSubmitView.as_view()),
]
