import uuid
from django.db import models
from softdelete.models import SoftDeleteObject
from startdate import settings


class Filter(SoftDeleteObject, models.Model):
    id = models.UUIDField(primary_key=True, verbose_name='Filter ID', default=uuid.uuid4, editable=False)
    content = models.JSONField(null=True, blank=True)
    candidate_id = models.ForeignKey('candidate.Candidate', on_delete=models.CASCADE, null=False, blank=False)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, related_name='filter_created_by',
                                   on_delete=models.DO_NOTHING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "filter"
