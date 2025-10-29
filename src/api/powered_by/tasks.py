from .classes.PoweredByWebhooks import PoweredByWebhooks
from .models import PoweredByWebhook
from celery import shared_task


@shared_task()
def process_powered_by_webhook_for_saving():
    powered_by_webhooks = PoweredByWebhook.objects.filter(saving_status='pending', type='success.parse_resume').order_by('created_at')
    webhook_selector = PoweredByWebhooks()
    for webhook in powered_by_webhooks:
        webhook.refresh_from_db()
        if webhook.status != 'pending':
            continue
        webhook.saving_status = 'in_progress'
        webhook.save()
        payload_json = webhook.payload
        webhook_selector.save_parsed_resume(webhook, payload_json)


@shared_task()
def process_parsed_powered_by_webhook():
    powered_by_webhooks = PoweredByWebhook.objects.filter(status='pending', type__icontains='parse_resume').order_by('created_at')
    webhook_selector = PoweredByWebhooks()
    for webhook in powered_by_webhooks:
        webhook.refresh_from_db()
        if webhook.status != 'pending':
            continue
        webhook.status = 'in_progress'
        webhook.save()
        payload_json = webhook.payload
        webhook_selector.selector(webhook, payload_json)


@shared_task()
def process_ranked_powered_by_webhook():
    powered_by_webhooks = PoweredByWebhook.objects.filter(status='pending', type__icontains='rank_resume').order_by('created_at')
    webhook_selector = PoweredByWebhooks()
    for webhook in powered_by_webhooks:
        webhook.refresh_from_db()
        if webhook.status != 'pending':
            continue
        webhook.status = 'in_progress'
        webhook.save()
        payload_json = webhook.payload
        webhook_selector.selector(webhook, payload_json)
