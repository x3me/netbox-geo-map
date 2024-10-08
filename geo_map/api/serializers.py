from dcim.models import CableTermination, Site
from netbox.api.serializers import NetBoxModelSerializer
from rest_framework import serializers
from circuits.models import Circuit, Provider


class SiteSerializer(NetBoxModelSerializer):
    url = serializers.HyperlinkedIdentityField(view_name="dcim:site")
    group = serializers.CharField(source="group.slug", read_only=True)

    class Meta:
        model = Site
        fields = (
            "id",
            "url",
            "name",
            "status",
            "group",
            "latitude",
            "longitude",
            "physical_address",
        )


class TerminationSerializer(NetBoxModelSerializer):
    site = serializers.IntegerField(source="_site_id")

    class Meta:
        model = CableTermination
        fields = (
            "id",
            "site",
        )


class CircuitSerializer(NetBoxModelSerializer):
    termination_a_site = serializers.IntegerField(source="termination_a.site_id")
    termination_z_site = serializers.IntegerField(source="termination_z.site_id")

    provider_color = serializers.SerializerMethodField()

    def get_provider_color(self, obj: Circuit):
        return obj.provider.cf.get("provider_color") if obj.provider else None

    class Meta:
        model = Circuit
        fields = (
            "id",
            "status",
            "termination_a_site",
            "termination_z_site",
            "provider_color",
        )


class ProviderSerializer(NetBoxModelSerializer):
    color = serializers.SerializerMethodField()
    regions = serializers.SerializerMethodField()

    def get_color(self, obj: Provider):
        return obj.cf.get("provider_color")

    def get_regions(self, obj: Provider):
        return list(
            set(
                [
                    termination.site.region_id
                    for circuit in obj.circuits.all()
                    for termination in circuit.terminations.all()
                ]
            )
        )

    class Meta:
        model = Provider
        fields = (
            "id",
            "name",
            "color",
            "regions",
        )
