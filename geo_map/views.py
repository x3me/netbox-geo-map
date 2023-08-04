from django.shortcuts import render
from django.contrib.auth.decorators import login_required


@login_required
def google_map(request):
    return render(request, "static/geo_map/html/index.html")
