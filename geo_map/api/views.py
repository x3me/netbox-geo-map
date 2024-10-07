from circuits.models import Circuit
from dcim.models import Site
from django.contrib.auth.mixins import PermissionRequiredMixin
from django_filters import rest_framework as filters
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet
from circuits.models import Circuit, Provider
from .serializers import CircuitSerializer, SiteSerializer, ProviderSerializer
from django.core.cache import cache
from rest_framework.response import Response
from django.core.cache import cache
from rest_framework.views import APIView
from django.db.models import Count
from rest_framework.viewsets import ModelViewSet
from circuits.models import Provider
from .serializers import ProviderSerializer


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


class ProviderViewSet(ModelViewSet):
    queryset = Provider.objects.all()
    serializer_class = ProviderSerializer

    def get_queryset(self):
        return Provider.objects.all()

    def list(self, request, *args, **kwargs):
        cached_providers = cache.get("cached_providers")
        if cached_providers is None:
            queryset = self.get_queryset()
            serialized_providers = ProviderSerializer(queryset, many=True).data
            cached_providers = serialized_providers
            cache.set(
                "cached_providers", cached_providers, 1800
            )  # Cache for 30 minutes
        return Response(cached_providers)


class ProviderListAPIView(APIView):
    def get(self):
        providers = (
            Provider.objects.annotate(circuit_count=Count("circuits"))
            .prefetch_related("circuits__terminations__site")
            .filter(circuit_count__gt=0)
            .order_by("name")
        )

        providers_data = [
            {
                "value": provider.id,
                "label": provider.name,
                "color": provider.cf.get("provider_color"),
            }
            for provider in providers
        ]

        return Response(providers_data)
