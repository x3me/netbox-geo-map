from dcim.models import Cable, Site
from django.contrib.auth.mixins import PermissionRequiredMixin
from django.db.models import Count, Q
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from .serializers import CableSerializer, SiteSerializer


class ListModelMixin:
    """
    List a queryset.
    """

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class SiteViewSet(PermissionRequiredMixin, GenericViewSet, ListModelMixin):
    permission_required = "dcim.view_site"

    queryset = Site.objects.exclude(latitude__isnull=True)
    serializer_class = SiteSerializer
    filterset_fields = ["status", "group"]


class CableViewSet(PermissionRequiredMixin, GenericViewSet, ListModelMixin):
    permission_required = "dcim.view_cable"

    queryset = Cable.objects.all().prefetch_related("tenant", "terminations")
    serializer_class = CableSerializer
    filterset_fields = ["status", "tenant"]

    def get_queryset(self):
        qs = super().get_queryset()

        # remove cables that are not connected to a site or have the same site on both ends
        qs = qs.exclude(terminations___site__isnull=True)
        qs = qs.annotate(
            distinct_sites=Count("terminations___site_id", distinct=True)
        ).exclude(distinct_sites__lte=1)

        return qs