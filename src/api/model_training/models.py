from django.db import models
import uuid

from softdelete.models import SoftDeleteObject


class TrainedTitle(SoftDeleteObject, models.Model):
    STATUS_CHOICES = (
        ("pending", "pending"),
        ("queued", "queued"),
        ("completed", "completed"),
        ("failed","failed"),
    )
    id = models.UUIDField(
        primary_key=True,
        verbose_name="Trained Title ID",
        default=uuid.uuid4,
        editable=False,
    )
    title = models.CharField(max_length=255, blank=True, null=True, unique=True)
    job_posting_id = models.ForeignKey(
        "job_posting.JobPosting", on_delete=models.CASCADE, blank=True, null=True
    )
    major_version = models.IntegerField(blank=True, null=True)
    minor_version = models.IntegerField(blank=True, null=True, unique=True)
    status = models.CharField(
        max_length=50, choices=STATUS_CHOICES, blank=True, null=True
    )
    is_active = models.BooleanField(default=False)
    model_s3_path = models.TextField(unique=True, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "trained_title"
        