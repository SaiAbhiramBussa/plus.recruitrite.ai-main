from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Location
from .services import location_address_generalise


@receiver(post_save, sender=Location)
def location_model_signal_receiver(instance, **kwargs):
    location_address_generalise(instance)
