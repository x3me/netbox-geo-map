from dcim.choices import SiteStatusChoices
from dcim.models import SiteGroup
from django.conf import settings
from django.contrib.auth.mixins import PermissionRequiredMixin
from django.db.models import Count
from django.shortcuts import render
from django.views import View
from tenancy.models import Tenant
from dcim.choices import LinkStatusChoices


CONFIG = settings.PLUGINS_CONFIG["geo_map"]


class GeoMapHomeView(PermissionRequiredMixin, View):
    permission_required = ("dcim.view_site", "dcim.view_cable")

    """
    Show the home page
    """

    def get(self, request):
        site_groups = SiteGroup.objects.filter(parent__isnull=True).order_by("name")
        tenants = (
            Tenant.objects.annotate(cable_count=Count("cables"))
            .filter(cable_count__gt=0)
            .order_by("name")
        )
        return render(
            request,
            "index.html",
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
                    for status in LinkStatusChoices
                ],
                "tenants": [
                    {"value": tenant.id, "label": tenant.name} for tenant in tenants
                ],
            },
        )
