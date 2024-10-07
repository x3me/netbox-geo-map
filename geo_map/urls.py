from django.urls import path

from geo_map.api.views import ProviderListAPIView


from . import views

urlpatterns = [
    path("", views.GeoMapHomeView.as_view(), name="home"),
    path(
        "api/plugins/geo_map/providers/",
        ProviderListAPIView.as_view(),
        name="provider-list-api",
    ),
]
