import os
from datetime import timedelta
from django.utils import timezone

from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.permissions import IsProviderRole
from catalog.models import ProviderProfile

from .mercadopago import create_preapproval, MercadoPagoError
from .models import Plan, Subscription
from .serializers import PlanPublicSerializer, SubscriptionSerializer, SubscriptionStartSerializer


class PublicPlanListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = PlanPublicSerializer

    def get_queryset(self):
        return Plan.objects.filter(active=True).order_by("tier", "interval_months")


class ProviderSubscriptionListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsProviderRole]
    serializer_class = SubscriptionSerializer

    def get_queryset(self):
        provider, _ = ProviderProfile.objects.get_or_create(user=self.request.user)
        return Subscription.objects.filter(provider=provider).select_related("plan").order_by("-created_at")


class ProviderSubscriptionStartView(APIView):
    permission_classes = [IsAuthenticated, IsProviderRole]

    def post(self, request):
        provider, _ = ProviderProfile.objects.get_or_create(user=request.user)

        s = SubscriptionStartSerializer(data=request.data)
        s.is_valid(raise_exception=True)

        plan_code = s.validated_data["plan_code"].strip()
        plan = Plan.objects.filter(code=plan_code, active=True).first()
        if not plan:
            return Response({"detail": "Plan no disponible"}, status=400)

        existing = Subscription.objects.filter(
            provider=provider,
            plan=plan,
            status__in=[Subscription.Status.PENDING, Subscription.Status.ACTIVE],
        ).order_by("-created_at").first()

        if existing and existing.status == Subscription.Status.ACTIVE:
            data = SubscriptionSerializer(existing).data
            data["checkout_url"] = existing.gateway_checkout_url
            return Response(data, status=200)

        sub = existing if existing else Subscription.objects.create(
            provider=provider,
            plan=plan,
            status=Subscription.Status.PENDING,
            gateway=Subscription.Gateway.MANUAL,
        )

        mp_token = os.getenv("MP_ACCESS_TOKEN", "").strip()
        back_url = os.getenv("MP_BACK_URL", "").strip()

        if mp_token and back_url:
            amount = plan.price_cents / 100.0
            frequency = 1 if plan.interval_months == 1 else plan.interval_months

            try:
                mp = create_preapproval(
                    access_token=mp_token,
                    payer_email=request.user.email,
                    reason=f"{plan.name} - Directorio Proveedores",
                    back_url=back_url,
                    currency_id=plan.currency,
                    transaction_amount=amount,
                    frequency=frequency,
                    frequency_type="months",
                    external_reference=f"sub:{sub.id}",
                )
            except MercadoPagoError as e:
                # ✅ no tirar 500
                return Response({"detail": str(e)}, status=400)

            checkout_url = mp.get("init_point") or mp.get("sandbox_init_point") or ""
            mp_id = str(mp.get("id") or "")
            mp_status = str(mp.get("status") or "")

            sub.gateway = Subscription.Gateway.MP
            sub.gateway_subscription_id = mp_id
            sub.gateway_checkout_url = checkout_url
            sub.gateway_status = mp_status
            sub.save(update_fields=[
                "gateway", "gateway_subscription_id", "gateway_checkout_url", "gateway_status", "updated_at"
            ])

            data = SubscriptionSerializer(sub).data
            data["checkout_url"] = checkout_url
            return Response(data, status=201)

        data = SubscriptionSerializer(sub).data
        data["checkout_url"] = ""
        return Response(data, status=201)
