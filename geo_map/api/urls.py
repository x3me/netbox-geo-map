from netbox.api.routers import NetBoxRouter

from .views import SiteViewSet, CableViewSet

router = NetBoxRouter()

router.register("sites", SiteViewSet)
router.register("links", CableViewSet)

urlpatterns = router.urls
