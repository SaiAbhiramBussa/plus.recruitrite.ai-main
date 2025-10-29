from django.db import models
import uuid
from django.conf import settings


class BackgroundJob(models.Model):
    STATUS_CHOICES = (
        ('pending', 'pending'),
        ('in_progress', 'in_progress'),
        ('failed', 'failed'),
        ('partial_success', 'partial_success'),
        ('success', 'success'),
    )

    id = models.UUIDField(primary_key=True, verbose_name='Background Job Id', default=uuid.uuid4, editable=False)
    key = models.TextField(blank=True, null=True)
    name = models.CharField(max_length=300, blank=False, null=False)
    status = models.CharField(max_length=300, blank=False, null=False, choices=STATUS_CHOICES)
    inserted_count = models.BigIntegerField(null=True, blank=True)
    updated_count = models.BigIntegerField(null=True, blank=True)
    failed_count = models.BigIntegerField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='job_created_by',
                                  on_delete=models.DO_NOTHING, null=True, blank=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='job_updated_by', null=True,
                                  blank=True, on_delete=models.DO_NOTHING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "background_job"

    def _str_(self):
        return f'{self.name}'


class ApolloJobs(models.Model):
    STATUS_CHOICES = (
        ('pending', 'pending'),
        ('in_progress', 'in_progress'),
        ('failed', 'failed'),
        ('paused', 'paused'),
        ('partial_success', 'partial_success'),
        ('success', 'success'),
    )
    FREQUENCY_CHOICES = (
        ('day', 'day'),
        ('week', 'week'),
        ('month', 'month'),
    )
    id = models.UUIDField(primary_key=True, verbose_name='Apollo Job Id', default=uuid.uuid4, editable=False)
    api_key = models.CharField(max_length=255, blank=True, null=True)
    apollo_job = models.CharField(max_length=255, blank=True, null=True)
    page_number = models.BigIntegerField(null=True, blank=True)
    fetch_limit = models.BigIntegerField(null=True, blank=True)
    frequency = models.CharField(max_length=100, null=True, blank=True, choices=FREQUENCY_CHOICES)
    status = models.CharField(max_length=300, blank=True, null=True, choices=STATUS_CHOICES)
    apollo_api_titles = models.TextField(null=True, blank=True)
    apollo_api_locations = models.TextField(null=True, blank=True)
    apollo_account_label_ids = models.TextField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='apollo_job_created_by',
                                   on_delete=models.DO_NOTHING, null=True, blank=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='apollo_job_updated_by', null=True,
                                   blank=True, on_delete=models.DO_NOTHING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    job = models.ForeignKey('job_posting.JobPosting', on_delete=models.DO_NOTHING, blank=True, null=True)

    class Meta:
        db_table = 'apollo_jobs'


class ApolloJobRecords(models.Model):
    id = id = models.UUIDField(primary_key=True, verbose_name='Apollo Job Record Id', default=uuid.uuid4, editable=False)
    records_inserted = models.BigIntegerField(null=True, blank=True)
    records_updated = models.BigIntegerField(null=True, blank=True)
    records_failed = models.BigIntegerField(null=True, blank=True)
    exception_logfile_url = models.TextField(null=True, blank=True)
    apollo_job = models.ForeignKey('celery_jobs.ApolloJobs', on_delete=models.DO_NOTHING, blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='apollo_job_record_created_by',
                                   on_delete=models.DO_NOTHING, null=True, blank=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='apollo_job_record_updated_by', null=True,
                                   blank=True, on_delete=models.DO_NOTHING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'apollo_job_records'