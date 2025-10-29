from django.db import models
import uuid
from startdate import settings


class PoweredByRequest(models.Model):
    id = models.UUIDField(primary_key=True, verbose_name='PoweredBy Request Id', default=uuid.uuid4, editable=False)
    request_headers = models.JSONField(blank=True, null=True)
    request_method = models.CharField(blank=True, null=True, max_length=155)
    request_body = models.JSONField(blank=True, null=True)
    api_response = models.JSONField(blank=True, null=True)
    processed_response = models.JSONField(blank=True, null=True)
    host = models.CharField(blank=True, null=True, max_length=255)
    company_id = models.ForeignKey('company.Company', on_delete=models.CASCADE, null=True, blank=True)
    credits_used = models.IntegerField(blank=True, null=True, default=0)
    completed_at = models.DateTimeField(blank=True, null=True)
    ip_address = models.CharField(blank=True, null=True, max_length=255)
    model = models.CharField(default='sd_v4', max_length=255)
    browser_id = models.CharField(blank=True, null=True, max_length=255)
    api_key = models.CharField(blank=True, null=True, max_length=255)
    processing_status = models.CharField(blank=True, null=True, max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='request_created_by',
                                   on_delete=models.DO_NOTHING, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='request_updated_by', null=True,
                                   blank=True, on_delete=models.DO_NOTHING)

    class Meta:
        db_table = "powered_by_request"


class PoweredByRequestAttachment(models.Model):
    id = models.UUIDField(primary_key=True, verbose_name='Attachment Request Id', default=uuid.uuid4, editable=False)
    processing_status = models.CharField(blank=True, null=True, max_length=255)
    s3_key = models.CharField(blank=True, null=True, max_length=255)
    candidate_id = models.ForeignKey('candidate.Candidate', on_delete=models.DO_NOTHING, blank=True, null=True)
    powered_by_request_id = models.ForeignKey('powered_by.PoweredByRequest', on_delete=models.DO_NOTHING, blank=False,
                                              null=False)
    openai_stats = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.DO_NOTHING, null=True, blank=True)

    class Meta:
        db_table = "powered_by_request_attachment"


class PoweredByWebhook(models.Model):
    id = models.UUIDField(primary_key=True, verbose_name='Attachment Request Id', default=uuid.uuid4, editable=False)
    type = models.CharField(blank=True, null=True, max_length=255)
    payload = models.JSONField(blank=True, null=True)
    status = models.CharField(blank=True, null=True, max_length=255)
    saving_status = models.CharField(blank=True, null=True, max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "powered_by_webhook"
