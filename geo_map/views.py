from django.shortcuts import render
from dcim.models import *
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse


@login_required
def google_map(request):
    return render(request, "index.html")


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
            }
        )
  
    return JsonResponse(site_info_list, safe=False)
