from django.db import models

# Create your models here.


from django.db import models
import uuid

from startdate import settings


# Create your models here.


class ConversationThread(models.Model):
    STATUS_CHOICES = (
        ("active", "active"),
        ("inactive", "inactive"),
    )
    id = models.UUIDField(
        primary_key=True, verbose_name="Thread Id", default=uuid.uuid4, editable=False
    )
    job_posting_id = models.ForeignKey(
        "job_posting.JobPosting", on_delete=models.DO_NOTHING, blank=True, null=True
    )
    employer_user_id = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="employer_user",
        on_delete=models.DO_NOTHING,
        null=True,
        blank=True,
    )
    candidate_user_id = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="candidate_user",
        on_delete=models.DO_NOTHING,
        null=True,
        blank=True,
    )
    status = models.CharField(
        choices=STATUS_CHOICES, max_length=100, blank=True, null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "conversation_thread"
        unique_together = ['candidate_user_id', 'job_posting_id']


class ThreadMessage(models.Model):

    id = models.UUIDField(
        primary_key=True, verbose_name="Message Id", default=uuid.uuid4, editable=False
    )
    content = models.TextField(null=False, blank=False)
    sender_user_id = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="sender_user",
        on_delete=models.DO_NOTHING,
        null=True,
        blank=True,
    )
    conversation_thread_id = models.ForeignKey(
        "conversation_thread.ConversationThread",
        related_name="thread_id",
        on_delete=models.DO_NOTHING,
        null=True,
        blank=True,
    )
    type = models.CharField(max_length=100, blank=False, null=False, default='general')
    is_read = models.BooleanField(default=False)
    is_alerted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "thread_message"


class Notification(models.Model):
    id = models.UUIDField(
        primary_key=True, verbose_name="Notification Id", default=uuid.uuid4, editable=False
    )
    content = models.TextField(null=False, blank=False)
    sender_user_id = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="sender",
        on_delete=models.DO_NOTHING,
        null=True,
        blank=True,
    )
    receiver_user_id = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="receiver",
        on_delete=models.DO_NOTHING,
        null=True,
        blank=True,
    )
    title = models.CharField(max_length=130, null=False, blank=False)
    type = models.CharField(max_length=100, null=False, blank=False, default='message')
    sent = models.BooleanField(default=False)
    is_read = models.BooleanField(default=False)
    error = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "notification"
