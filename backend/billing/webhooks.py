import os
from datetime import timedelta
from django.utils import timezone
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .mercadopago import get_preapproval
from .models import Subscription


class MercadoPagoWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data or {}
        mp_id = None

        if isinstance(data, dict):
            mp_id = (data.get("data") or {}).get("id") or data.get("id")

        mp_id = mp_id or request.query_params.get("data.id") or request.query_params.get("id")
        if not mp_id:
            return Response({"detail": "missing mp id"}, status=400)

        mp_token = os.getenv("MP_ACCESS_TOKEN", "").strip()
        if not mp_token:
            return Response({"detail": "mp token not configured"}, status=500)

        mp = get_preapproval(mp_token, str(mp_id))
        mp_status = str(mp.get("status") or "").lower()

        sub = Subscription.objects.filter(gateway_subscription_id=str(mp_id)).select_related("plan").order_by("-id").first()
        if not sub:
            return Response({"detail": "subscription not found"}, status=404)

        sub.gateway_status = mp_status

        now = timezone.now()

        if mp_status in ("authorized", "active"):
            sub.status = Subscription.Status.ACTIVE
            sub.current_period_start = now
            # aproximación: 30 días por mes
            days = 30 * int(sub.plan.interval_months or 1)
            sub.current_period_end = now + timedelta(days=days)
        elif mp_status in ("cancelled", "canceled"):
            sub.status = Subscription.Status.CANCELED
        else:
            sub.status = Subscription.Status.PENDING

        sub.save(update_fields=["status", "gateway_status", "current_period_start", "current_period_end", "updated_at"])
        return Response({"ok": True})
