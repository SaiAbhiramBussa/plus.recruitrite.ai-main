from datetime import datetime
from celery import shared_task
from candidate.aws import s3
from company.models import Subscription
from payment_history.models import StripeWebHook
from startdate import settings
import json
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from decouple import config



DEFAULT_EMAIL = config("DEFAULT_EMAIL")
EVENTS_BUCKET = settings.AWS_TRIGGER_EVENTS_BUCKET_NAME
ai_silver_price_id = settings.AI_SILVER_SUBSCRIPTION_PRICE_ID
ai_gold_price_id = settings.AI_GOLD_SUBSCRIPTION_PRICE_ID
ai_gold_reveals = settings.AI_GOLD_SUBSCRIPTION_REVEALS
ai_silver_reveals = settings.AI_SILVER_SUBSCRIPTION_REVEALS
EMAIL_CLIENT = settings.EMAIL_CLIENT


@shared_task
def check_expired_subscription():
    expiry_subscriptions = Subscription.objects.filter(is_expired=False).filter(end_date__lt=datetime.fromisoformat(str(datetime.now())))
    if expiry_subscriptions.count() == 0:
        quit
    for subscription in expiry_subscriptions:
        subscription.is_expired = True
        subscription.save()


@shared_task
def process_stripe_webhook():
    from .services import invoice_payment_succeeded, invoice_payment_failed
    events_type = ['invoice.payment_succeeded', 'invoice.payment_failed']
    stripe_events = StripeWebHook.objects.filter(event_type__in=events_type, status='pending')
    for s_event in stripe_events:
        s_event.status = 'in_progress'
        s_event.save()
        obj = s3.Object(EVENTS_BUCKET, s_event.key)
        file_object = obj.get()['Body'].read()
        json_object = json.loads(file_object.decode('utf-8'))
        invoice = json_object['data']['object']

        if s_event.event_type == 'invoice.payment_succeeded':
            status_message = invoice_payment_succeeded(invoice)
        else:
            status_message = invoice_payment_failed(invoice)

        s_event.status = status_message
        s_event.save()


@shared_task()
def send_payment_mail(mail_data, status, user_email):
    mail_data.update({
        "support_email": config("SUPPORT_EMAIL")
    })
    subject_data = {'subscription_type': mail_data['subscription_type']}
    if config("ENVIRONMENT") != 'Production':
        subject_data.update({"environment": f'[{config("ENVIRONMENT")}] - '})
    if status == 'success':
        email_body = render_to_string("payment_successful.html", mail_data)
        subject = render_to_string("payment_successful.txt", subject_data)
    else:
        email_body = render_to_string("payment_failed.html", mail_data)
        subject = render_to_string("payment_failed.txt", subject_data)
    to_email = user_email
    bcc = config("BILLING_EMAIL")
    from_email = DEFAULT_EMAIL

    message = {
        "senderAddress": DEFAULT_EMAIL,  
        "recipients": {
            "to": [{"address": to_email}],
            "bcc": [{"address": bcc}]
        },
        "content": {
            "subject": subject,
            "html": email_body
        }
    }
    EMAIL_CLIENT.begin_send(message)
