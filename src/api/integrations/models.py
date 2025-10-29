from django.db import models
import uuid

from softdelete.models import SoftDeleteObject

from startdate import settings
from django.db.models.signals import pre_save
from django.dispatch import receiver
# Validators
from django.core.exceptions import ValidationError


class IntegrationKey(SoftDeleteObject, models.Model):

    INTEGRATION_CHOICES = (
        ('jazzHR', 'jazzHR'),
        ('workable', 'workable'),
        ('poweredBy', 'poweredBy')
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    key = models.CharField(max_length=255, blank=False, null=False)
    company_id = models.ForeignKey('company.Company', on_delete=models.CASCADE, blank=False, null=False)
    type = models.CharField(max_length=255, null=True, blank=False, choices=INTEGRATION_CHOICES)
    is_active = models.BooleanField(default=True, null=False, blank=False)
    credentials = models.TextField(null=True, blank=False)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='integration_key_created_by',
                                   on_delete=models.DO_NOTHING, null=True, blank=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='integration_key_updated_by', null=True,
                                   blank=True, on_delete=models.DO_NOTHING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "integration_key"


@receiver(pre_save, sender=IntegrationKey)
def your_model_pre_save(sender, instance, **kwargs):
    if instance.id:
        integrations = IntegrationKey.objects.filter(company_id_id=instance.company_id_id, type=instance.type).exclude(type='poweredBy')
        if len(integrations) > 0 and integrations.first().id != instance.id:
            raise ValidationError(
                instance.type + " integration already exists"
            )
