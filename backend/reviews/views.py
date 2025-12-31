from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import generics
from rest_framework.throttling import ScopedRateThrottle

from catalog.models import ProviderProfile
from .models import Review
from .permissions import IsAdminRole, IsStaffUser
from .serializers import (
    ReviewPublicSerializer,
    ReviewUpsertSerializer,
    PublicReviewSubmitSerializer,
    ReviewPrivateSerializer,
    ReviewModerationSerializer,
)


# -------- PUBLIC: listar reviews publicadas de un proveedor --------
class PublicProviderReviewsView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = ReviewPublicSerializer

    def get_queryset(self):
        slug = self.kwargs["slug"]
        return Review.objects.filter(
            provider__slug=slug,
            status=Review.Status.PUBLISHED,
            provider__is_visible=True,
        ).order_by("-created_at")


# -------- PUBLIC: enviar review sin login (queda PENDING) --------
class PublicProviderReviewSubmitView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "public_review_submit"  # ver settings

    def post(self, request, slug):
        provider = ProviderProfile.objects.filter(slug=slug, is_visible=True).first()
        if not provider:
            return Response({"detail": "Proveedor no encontrado"}, status=404)

        s = PublicReviewSubmitSerializer(data=request.data)
        s.is_valid(raise_exception=True)

        data = s.validated_data

        # update_or_create: si el mismo email ya opinó, se actualiza (1 por proveedor/email)
        review, _ = Review.objects.update_or_create(
            provider=provider,
            reviewer=None,
            reviewer_email=data["email"].lower(),
            defaults={
                "reviewer_name": data["name"].strip(),
                "reviewer_phone": (data.get("phone") or "").strip(),
                "reviewer_org": (data.get("org") or "").strip(),
                "rating": data["rating"],
                "comment": (data.get("comment") or "").strip(),
                "status": Review.Status.PENDING,
                "source": Review.Source.PUBLIC,
            },
        )

        return Response(
            {"ok": True, "status": review.status},
            status=201,
        )


# -------- PRIVATE: admin crea/edita SU review para ese proveedor (queda PENDING) --------
class ProviderReviewUpsertView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request, slug):
        review = Review.objects.filter(provider__slug=slug, reviewer=request.user).first()
        if not review:
            return Response({"detail": "No hay reseña todavía"}, status=404)
        return Response(ReviewPrivateSerializer(review).data)

    def post(self, request, slug):
        provider = ProviderProfile.objects.filter(slug=slug, is_visible=True).first()
        if not provider:
            return Response({"detail": "Proveedor no encontrado o no visible"}, status=404)

        s = ReviewUpsertSerializer(data=request.data)
        s.is_valid(raise_exception=True)

        review, _ = Review.objects.update_or_create(
            provider=provider,
            reviewer=request.user,
            defaults={
                "rating": s.validated_data["rating"],
                "comment": s.validated_data.get("comment", ""),
                "status": Review.Status.PENDING,
                "source": Review.Source.ADMIN,
            },
        )
        return Response(ReviewPrivateSerializer(review).data, status=201)


# -------- BACKOFFICE: listar / moderar --------
class BackofficeReviewListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsStaffUser]
    serializer_class = ReviewPrivateSerializer

    def get_queryset(self):
        status = self.request.query_params.get("status", Review.Status.PENDING)
        return Review.objects.filter(status=status).select_related("provider", "reviewer").order_by("-created_at")


class BackofficeReviewModerateView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated, IsStaffUser]
    serializer_class = ReviewModerationSerializer
    queryset = Review.objects.all()
