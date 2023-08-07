from django.urls import path
from . import views

urlpatterns = [
    path("", views.google_map, name="google_map"),
    path("api/sites", views.get_sites, name="api_sites"),
]
