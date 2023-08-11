from dcim.models import Cable, CableTermination, Site
from netbox.api.serializers import NetBoxModelSerializer
from rest_framework import serializers


class SiteSerializer(NetBoxModelSerializer):
    url = serializers.HyperlinkedIdentityField(view_name="dcim:site")

    class Meta:
        model = Site
        fields = (
            "id",
            "url",
            "name",
            "status",
            "latitude",
            "longitude",
        )


class TerminationSerializer(NetBoxModelSerializer):
    site = serializers.IntegerField(source="_site_id")

    class Meta:
        model = CableTermination
        fields = (
            "id",
            "site",
        )


class CableSerializer(NetBoxModelSerializer):
    terminations = TerminationSerializer(many=True)

    def color(self, obj: Cable):
        c = obj.tenant.custom_fields.get("color") if obj.tenant else None
        return c or obj.color

    class Meta:
        model = Cable
        fields = (
            "id",
            "status",
            "terminations",
            "color",
        )
