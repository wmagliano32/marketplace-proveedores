from rest_framework import serializers
from .models import Review


class ReviewPublicSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ("rating", "comment", "created_at", "author")

    def get_author(self, obj: Review) -> str:
        if obj.reviewer_id:
            return "Administrador verificado"
        return obj.reviewer_name or "Cliente"


class ReviewUpsertSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(allow_blank=True, required=False)


class PublicReviewSubmitSerializer(serializers.Serializer):
    # honeypot (bots)
    website = serializers.CharField(required=False, allow_blank=True)

    name = serializers.CharField(max_length=120)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=50, required=False, allow_blank=True)
    org = serializers.CharField(max_length=140, required=False, allow_blank=True)

    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(required=False, allow_blank=True, max_length=2000)

    def validate_website(self, value):
        # si el bot completa este campo, rechazamos
        if value and value.strip():
            raise serializers.ValidationError("Invalid")
        return value


class ReviewPrivateSerializer(serializers.ModelSerializer):
    provider_slug = serializers.CharField(source="provider.slug", read_only=True)
    reviewer_email_user = serializers.CharField(source="reviewer.email", read_only=True)

    class Meta:
        model = Review
        fields = (
            "id",
            "provider_slug",
            "source",
            "status",
            "rating",
            "comment",
            "reviewer_email_user",
            "reviewer_name",
            "reviewer_email",
            "reviewer_phone",
            "reviewer_org",
            "created_at",
            "updated_at",
        )


class ReviewModerationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ("status",)
