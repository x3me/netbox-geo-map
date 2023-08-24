from netbox.api.routers import NetBoxRouter

from .views import SiteViewSet, LinkViewSet

router = NetBoxRouter()

router.register("sites", SiteViewSet)
router.register("links", LinkViewSet)

urlpatterns = router.urls
