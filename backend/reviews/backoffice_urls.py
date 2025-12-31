from django.urls import path
from .views import BackofficeReviewListView, BackofficeReviewModerateView

urlpatterns = [
    path("reviews/", BackofficeReviewListView.as_view()),
    path("reviews/<int:pk>/", BackofficeReviewModerateView.as_view()),
]
