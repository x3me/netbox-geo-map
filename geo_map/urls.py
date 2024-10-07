from django.urls import path
from geo_map.api.views import ProviderViewSet

from . import views

urlpatterns = [
    path("", views.GeoMapHomeView.as_view(), name="home"),
    path(
        "api/plugins/geo_map/providers/",
        ProviderViewSet.as_view({"get": "list"}),
        name="provider-list-api",
    ),
]
