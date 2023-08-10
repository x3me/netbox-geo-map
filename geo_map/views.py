from django.shortcuts import render
from dcim.models import *
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse


@login_required
def google_map(request):
    return render(request, "index.html")
groups = {
    "Distribution": "distribution",
    "Access": "access",
    "Pit": "fiberpit",
    "Core": "core",
}
statuses = {
    "planned": "_planned",
    "staging": "_staging",
    "active": "_active",
    "decommissioning": "_decommissioning",
    "retired": "_retired",
}

@login_required
def get_sites(request):
    _sites = Site.objects.exclude(latitude__isnull=True).values(
        "_name", "latitude", "longitude", "status", "group__name"
    )
    site_info_list = []
    for _site in _sites:
        site_info_list.append(
            {
                "title": _site["_name"],
                "position": {
                    "lat": float(_site["latitude"]),
                    "lng": float(_site["longitude"]),
                },
                "status": _site["status"],
                "group": _site["group__name"],
                "icon": {
                   "url": f"/static/geo_map/assets/icons/{groups.get(_site['group__name'], 'default_group')}{statuses.get(_site['status'], 'default_status')}.png",
                },
            }
        )
  
    return JsonResponse(site_info_list, safe=False)
