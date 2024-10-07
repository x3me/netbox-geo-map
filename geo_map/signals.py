from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from circuits.models import Provider
from django.core.cache import cache


@receiver([post_save, post_delete], sender=Provider)
def clear_or_extend_provider_cache(sender, **kwargs):
    cached_providers = cache.get("cached_providers")

    if cached_providers:
        cache.set("cached_providers", cached_providers, timeout=1800)
    else:
        cache.delete("cached_providers")
