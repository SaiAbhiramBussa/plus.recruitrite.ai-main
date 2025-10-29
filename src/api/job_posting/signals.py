from django.db.models.signals import post_save
from django.dispatch import receiver
from conversation_thread.models import Notification
from job_posting.models import JobPosting, JobPostingReveals
from job_posting.services import job_posting_address_generalise
from model_training.services import create_training_record


@receiver(post_save, sender=JobPosting)
def job_posting_address_signal(instance, **kwargs):
    job_posting_address_generalise(instance)


@receiver(post_save, sender=JobPosting)
def job_posting_training_signal(instance, **kwargs):
    create_training_record(instance.title, instance.id)


@receiver(post_save, sender=JobPostingReveals)
def jp_reveal_post_signal(sender, instance, **kwargs):
    from accounts.tasks import send_notification_email, create_push_notification
    if instance.candidate_id and instance.candidate_id.user_id:
        email = {
            'type': 'new_match',
            'content': {
                'job_posting': instance.job_posting_id.title,
                'company': instance.job_posting_id.location_id.company_id.name,
                'logo': instance.job_posting_id.location_id.company_id.logo,
            }
        }

        send_notification_email.delay(email, instance.candidate_id.user_id.id)
        device_token = instance.candidate_id.user_id.device_token
        if device_token:
            notification = Notification.objects.create(type='match', title='New Match', content=f"New Match for {email['content']['job_posting']} for {email['content']['company']}", receiver=instance.candidate_id.user_id)
            create_push_notification.delay(device_token, notification.id)
