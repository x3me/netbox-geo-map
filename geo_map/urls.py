from django.urls import path
from . import views

urlpatterns = [
    path("geo-map/", views.google_map, name="google_map"),
]
