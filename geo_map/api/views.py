from circuits.models import Circuit
from dcim.models import Site
from django.contrib.auth.mixins import PermissionRequiredMixin
from django_filters import rest_framework as filters
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet
from circuits.models import Circuit, Provider
from .serializers import CircuitSerializer, SiteSerializer, ProviderSerializer


class ListModelMixin:
    """
    List a queryset.
    """

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class SiteFilter(filters.FilterSet):
    class Meta:
        model = Site
        fields = {
            "status": ["exact", "in"],
            "group": ["exact", "in"],
        }


class CircuitFilter(filters.FilterSet):
    class Meta:
        model = Circuit
        fields = {
            "status": ["exact", "in"],
            "provider": ["exact", "in"],
        }


class SiteViewSet(PermissionRequiredMixin, GenericViewSet, ListModelMixin):
    permission_required = "dcim.view_site"

    queryset = Site.objects.exclude(latitude__isnull=True).prefetch_related("group")
    serializer_class = SiteSerializer
    filterset_class = SiteFilter


class LinkViewSet(PermissionRequiredMixin, GenericViewSet, ListModelMixin):
    permission_required = "circuits.view_circuit"

    queryset = Circuit.objects.all().prefetch_related(
        "termination_a", "termination_z", "provider"
    )
    serializer_class = CircuitSerializer
    filterset_class = CircuitFilter

    def get_queryset(self):
        qs = super().get_queryset()

        qs = qs.exclude(termination_a__site__isnull=True)
        qs = qs.exclude(termination_z__site__isnull=True)
        qs = qs.exclude(provider__isnull=True)

        return qs


class ProviderViewSet(PermissionRequiredMixin, GenericViewSet, ListModelMixin):
    permission_required = "circuits.view_circuit"

    queryset = Provider.objects.all()
    serializer_class = ProviderSerializer

    # def get_queryset(self):
    #     qs = super().get_queryset()

    #     qs = qs.exclude(termination_a__site__isnull=True)
    #     qs = qs.exclude(termination_z__site__isnull=True)
    #     qs = qs.exclude(provider__isnull=True)

    #     return qs
