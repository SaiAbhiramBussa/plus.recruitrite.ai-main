from django.db import models
import uuid
from softdelete.models import SoftDeleteObject
from startdate import settings


class Payment_history(SoftDeleteObject, models.Model):
    id = models.UUIDField(primary_key=True, verbose_name='Payment History Id', default=uuid.uuid4, editable=False)
    amount = models.FloatField(blank=True, null=True)
    tax = models.FloatField(blank=True, null=True)
    subtotal = models.FloatField(blank=True, null=True)
    currency = models.CharField(max_length=155, null=True, blank=True)
    payment_on = models.DateField(blank=True, null=True)
    price_id = models.CharField(max_length=255, null=True, blank=True)
    payment_method_id = models.CharField(max_length=255, null=True, blank=True)
    payment_intent_id = models.CharField(max_length=255, null=True, blank=True)
    status = models.CharField(max_length=155, null=True, blank=True)
    stripe_subscription_id = models.CharField(max_length=255, null=True, blank=True)
    invoice_id = models.CharField(max_length=255, null=True, blank=True)
    invoice_url = models.TextField(blank=True, null=True)
    invoice_pdf = models.TextField(blank=True, null=True)
    receipt_url = models.TextField(blank=True, null=True)
    stripe_charge_id = models.CharField(max_length=255, null=True, blank=True)
    stripe_customer_id = models.CharField(max_length=255, null=True, blank=True)
    stripe_transaction_hash = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='payment_history_created_by',
                                   on_delete=models.DO_NOTHING, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='payment_history_updated_by', null=True,
                                   blank=True, on_delete=models.DO_NOTHING)

    class Meta:
        db_table = "payment_history"


class StripeWebHook(models.Model):

    id = models.UUIDField(primary_key=True, verbose_name='Stripe WebHook Event Id', default=uuid.uuid4, editable=False)
    event_id = models.TextField(blank=True, null=True)
    event_type = models.TextField(blank=True, null=True)
    key = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=200, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "stripe_webhook"
