from django.db import models
import uuid

from softdelete.models import SoftDeleteObject

from startdate import settings


class MLProcess(models.Model):
    STATUS_CHOICES = (
        ('processed', 'processed'),
        ('unprocessed', 'unprocessed'),
    )
    id = models.UUIDField(primary_key=True, verbose_name='ML Process Id', default=uuid.uuid4, editable=False)
    job_posting_id = models.ForeignKey('job_posting.JobPosting', on_delete=models.DO_NOTHING, blank=True, null=True)
    prescreen_candidates_input = models.TextField(blank=True, null=True)
    job_description_input = models.TextField(blank=True, null=True)
    job_posting_candidate_count = models.BigIntegerField(blank=True, null=True)
    status = models.CharField(choices=STATUS_CHOICES, max_length=100, blank=True, null=True)
    ml_output = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "ml_process"


class MLTrainingData(SoftDeleteObject, models.Model):
    TARGET_LABELS = [
        {"type": "future_title", "weightage": 40},
        {"type": "recent_title", "weightage": 90},
        {"type": "recent_skip_title", "weightage": 80},
        {"type": "exists_anywhere", "weightage": 40},
        {"type": "summary", "weightage": 10}
    ]
    id = models.UUIDField(primary_key=True, verbose_name='ML Training Rank Id', default=uuid.uuid4, editable=False)
    job_posting_id = models.ForeignKey('job_posting.JobPosting', on_delete=models.CASCADE, blank=True, null=True)
    candidate_id = models.ForeignKey('candidate.Candidate', on_delete=models.CASCADE, blank=True, null=True)
    target_label = models.IntegerField(blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='training_data_created_by',
                                   on_delete=models.DO_NOTHING, null=True, blank=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='training_data_updated_by', null=True,
                                   blank=True, on_delete=models.DO_NOTHING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "ml_training_data"
