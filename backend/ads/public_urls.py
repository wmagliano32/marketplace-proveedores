from django.urls import path
from .views import PublicAdSlotView, PublicAdImpressionView, PublicAdClickView
from .request_views import PublicAdRequestCreateView

urlpatterns = [
    path("ads/slot/", PublicAdSlotView.as_view()),
    path("ads/<int:pk>/impression/", PublicAdImpressionView.as_view()),
    path("ads/<int:pk>/click/", PublicAdClickView.as_view()),
    path("ads/request/", PublicAdRequestCreateView.as_view()),
]
