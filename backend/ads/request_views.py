from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser

from .models import AdRequest


class PublicAdRequestCreateView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        data = request.data

        placement = (data.get("placement") or "").strip().upper()
        if placement not in ("HEADER", "FOOTER", "LEFT_RAIL", "RIGHT_RAIL"):
            return Response({"detail": "placement inválido"}, status=400)

        sponsor_name = (data.get("sponsor_name") or "").strip()
        contact_name = (data.get("contact_name") or "").strip()
        contact_email = (data.get("contact_email") or "").strip()

        if not sponsor_name or not contact_name or not contact_email:
            return Response({"detail": "Faltan datos obligatorios (empresa, nombre, email)."}, status=400)

        creative_type = (data.get("creative_type") or "IMAGE").strip().upper()
        if creative_type not in ("IMAGE", "COMPOSED"):
            creative_type = "IMAGE"

        animation = (data.get("animation") or "NONE").strip().upper()
        if animation not in ("NONE", "PULSE", "FLOAT"):
            animation = "NONE"

        duration_months = int(data.get("duration_months") or 1)
        duration_months = max(1, min(duration_months, 24))

        req = AdRequest.objects.create(
            placement=placement,
            sponsor_name=sponsor_name,
            contact_name=contact_name,
            contact_email=contact_email,
            contact_phone=(data.get("contact_phone") or "").strip(),
            link_url=(data.get("link_url") or "").strip(),
            creative_type=creative_type,
            animation=animation,
            title=(data.get("title") or "").strip(),
            subtitle=(data.get("subtitle") or "").strip(),
            cta_text=(data.get("cta_text") or "").strip(),
            background_color=(data.get("background_color") or "").strip(),
            text_color=(data.get("text_color") or "").strip(),
            font_family=(data.get("font_family") or "").strip(),
            font_size=int(data.get("font_size") or 16),
            duration_months=duration_months,
            notes=(data.get("notes") or "").strip(),
        )

        # files
        if "logo" in request.FILES:
            req.logo = request.FILES["logo"]
        if "image" in request.FILES:
            req.image = request.FILES["image"]
        req.save()

        return Response({"ok": True, "request_id": req.id}, status=201)
