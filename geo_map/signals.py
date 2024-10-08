from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from circuits.models import Provider
from django.core.cache import cache


@receiver([post_save, post_delete], sender=Provider)
def clear_or_extend_provider_cache(sender, **kwargs):
    cache.delete("cached_providers")
