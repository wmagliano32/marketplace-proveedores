from rest_framework import serializers
from .models import AdBanner


class PublicAdSerializer(serializers.ModelSerializer):
    track_impression_url = serializers.SerializerMethodField()
    track_click_url = serializers.SerializerMethodField()
    logo_url = serializers.SerializerMethodField()
    image_file_url = serializers.SerializerMethodField()

    class Meta:
        model = AdBanner
        fields = (
            "id",
            "placement",
            "creative_type",
            "animation",
            "sponsor_name",
            "title",
            "subtitle",
            "cta_text",
            "background_color",
            "text_color",
            "font_family",
            "font_size",
            "logo_url",
            "image_file_url",
            "image_url",
            "link_url",
            "track_impression_url",
            "track_click_url",
        )

    def get_track_impression_url(self, obj: AdBanner):
        request = self.context.get("request")
        path = f"/api/public/ads/{obj.id}/impression/"
        return request.build_absolute_uri(path) if request else path

    def get_track_click_url(self, obj: AdBanner):
        request = self.context.get("request")
        path = f"/api/public/ads/{obj.id}/click/"
        return request.build_absolute_uri(path) if request else path

    def get_logo_url(self, obj: AdBanner):
        if not obj.logo:
            return ""
        request = self.context.get("request")
        url = obj.logo.url
        return request.build_absolute_uri(url) if request else url

    def get_image_file_url(self, obj: AdBanner):
        if not obj.image:
            return ""
        request = self.context.get("request")
        url = obj.image.url
        return request.build_absolute_uri(url) if request else url
