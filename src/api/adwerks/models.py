from django.db import models
import uuid
from rest_framework import serializers
from softdelete.models import SoftDeleteObject


# Create your models here.

class AdwerkMailRecords(SoftDeleteObject, models.Model):
    id = id = models.UUIDField(primary_key=True, verbose_name='Adwerk Mail Record Id', default=uuid.uuid4, editable=False)
    sent_from = models.EmailField(blank=False, null=False)
    sent_to = models.EmailField(blank=False, null=False)
    subject = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=255, blank=False, null=False)
    send_at = models.DateTimeField(blank=False)
    follow_up = models.IntegerField(blank=True)
    job_posting_id = models.ForeignKey('job_posting.JobPosting', on_delete=models.CASCADE, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    type = models.CharField(max_length=255, blank=True, null=True)
    
    class Meta:
        db_table = 'adwerk_mail_records'


class AdwerkUnsubscribe(models.Model):

    id = id = models.UUIDField(primary_key=True, verbose_name='Adwerk Unsubscribe Record Id', default=uuid.uuid4, editable=False)
    unsubscribe_email = models.EmailField(blank=False, null=False)
    unsubscribe_at = models.DateTimeField(blank=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    external_id = models.CharField(max_length=255, blank=True, null=True, unique=True)

    class Meta:
        db_table = 'adwerk_unsubscribe_records'
