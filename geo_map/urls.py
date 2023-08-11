from django.urls import path

from . import views

urlpatterns = [
    path("", views.GeoMapHomeView.as_view(), name="home"),
]
