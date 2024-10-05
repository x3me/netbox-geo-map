from dcim.choices import SiteStatusChoices
from dcim.models import SiteGroup
from django.conf import settings
from django.contrib.auth.mixins import PermissionRequiredMixin
from django.shortcuts import render
from django.views import View
from circuits.choices import CircuitStatusChoices
from dcim.models import Region
from circuits.models import Provider
from django.db.models import Count

CONFIG = settings.PLUGINS_CONFIG["geo_map"]
from django.core.cache import cache

class GeoMapHomeView(PermissionRequiredMixin, View):
    permission_required = ("dcim.view_site", "circuits.view_circuit")

    def get(self, request):
        cached_providers = cache.get('cached_providers')

        if cached_providers is None:
            providers = Provider.objects.annotate(circuit_count=Count("circuits")) \
                        .prefetch_related("circuits__terminations__site") \
                        .filter(circuit_count__gt=0) \
                        .order_by("name")
            
            cached_providers = [
                {
                    "value": provider.id,
                    "label": provider.name,
                    "color": provider.cf.get("provider_color"),
                }
                for provider in providers
            ]
            cache.set('cached_providers', cached_providers, 1800)  

        site_groups = SiteGroup.objects.filter(parent__isnull=True).order_by("name")

        return render(
            request,
            "index.html.j2",
            {
                "google_maps_key": CONFIG["google_maps_key"],
                "site_statuses": [
                    {"value": status[0], "label": status[1]}
                    for status in SiteStatusChoices.CHOICES
                ],
                "site_groups": [
                    {"value": group.id, "label": group.name} for group in site_groups
                ],
                "link_statuses": [
                    {"value": status[0], "label": status[1]}
                    for status in CircuitStatusChoices
                ],
                "providers": cached_providers, 
                "regions": [
                    {
                        "value": region.id,
                        "label": region.name,
                    }
                    for region in Region.objects.order_by("name")
                ],
            },
        )

    permission_required = ("dcim.view_site", "circuits.view_circuit")

    """
    Show the home page
    """

    def get(self, request):
        site_groups = SiteGroup.objects.filter(parent__isnull=True).order_by("name")
        providers: list[Provider] = (
            Provider.objects.annotate(circuit_count=Count("circuits"))
            .prefetch_related("circuits__terminations__site")
            .filter(circuit_count__gt=0)
            .order_by("name")
        )

        return render(
            request,
            "index.html.j2",
            {
                "google_maps_key": CONFIG["google_maps_key"],
                "site_statuses": [
                    {"value": status[0], "label": status[1]}
                    for status in SiteStatusChoices.CHOICES
                ],
                "site_groups": [
                    {"value": group.id, "label": group.name} for group in site_groups
                ],
                "link_statuses": [
                    {"value": status[0], "label": status[1]}
                    for status in CircuitStatusChoices
                ],
                "providers": [
                    {
                        "value": provider.id,
                        "label": provider.name,
                        "color": provider.cf.get("provider_color"),
                    }
                    for provider in providers
                ],
                "regions": [
                    {
                        "value": region.id,
                        "label": region.name,
                    }
                    for region in Region.objects.order_by("name")
                ],
            },
        )
