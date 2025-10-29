import uuid
from django.db import models
from softdelete.models import SoftDeleteObject
from startdate import settings




class GenProfileProcess(models.Model):
    STATUS_CHOICES = (
        ('pending', 'pending'),
        ('in_progress', 'in_progress'),
        ('already_generated', 'already_generated'),
        ('success', 'success'),
        ('failed','failed')
    )
    id = models.UUIDField(primary_key=True, verbose_name='Candidate Process Id', default=uuid.uuid4, editable=False)
    candidate_id = models.ForeignKey('candidate.Candidate', on_delete=models.CASCADE, blank=True, null=True)
    status = models.CharField(choices=STATUS_CHOICES, max_length=100, blank=True, null=True)
    gen_candidate_id = models.UUIDField(verbose_name='Candidate GenProfile Id', editable=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "gen_profile_process"