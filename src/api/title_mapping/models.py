from django.db import models
import uuid


class JobTitle(models.Model):
    id = models.UUIDField(
        primary_key=True,
        verbose_name="Job Title ID",
        default=uuid.uuid4,
        editable=False,
    )
    title = models.CharField(max_length=255, blank=False, null=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "job_title"


class JobTitleMapping(models.Model):
    id = models.UUIDField(
        primary_key=True,
        verbose_name="Job Title Mapping ID",
        default=uuid.uuid4,
        editable=False,
    )
    from_title = models.ForeignKey("title_mapping.JobTitle", related_name='from_title', on_delete=models.CASCADE, blank=False, null=False)
    to_title = models.ForeignKey("title_mapping.JobTitle", related_name='to_title', on_delete=models.CASCADE, blank=False, null=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "job_title_mapping"
        unique_together = ['from_title', 'to_title']
