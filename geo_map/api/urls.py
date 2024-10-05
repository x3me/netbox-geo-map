from netbox.api.routers import NetBoxRouter

from .views import SiteViewSet, LinkViewSet, ProviderViewSet

router = NetBoxRouter()

router.register("sites", SiteViewSet)
router.register("links", LinkViewSet)
router.register("providers", ProviderViewSet, basename="provider")

urlpatterns = router.urls
