from django.urls import path
from .views import (
    PublicCategoryListView,
    PublicSubcategoryListView,
    PublicProviderListView,
    PublicProviderDetailView,
    PublicRankingView,
    PublicLocationsView,
    PublicLocationFacetsView,
    PublicCatalogFacetsView,
)

urlpatterns = [
    path("categories/", PublicCategoryListView.as_view()),
    path("subcategories/", PublicSubcategoryListView.as_view()),
    path("providers/", PublicProviderListView.as_view()),
    path("providers/<slug:slug>/", PublicProviderDetailView.as_view()),
    path("ranking/", PublicRankingView.as_view()),
    path("locations/", PublicLocationsView.as_view()),
    path("location-facets/", PublicLocationFacetsView.as_view()),
    path("catalog-facets/", PublicCatalogFacetsView.as_view()),
]
