import datetime

from celery import shared_task
from django.db.models import F
from conversation_thread.models import ThreadMessage, ConversationThread, Notification
from .classes.EmailNotification import EmailNotification
from .models import NotificationSettings, User
from .services import send_push_notification


@shared_task(queue='mlqueue')
def send_notification_email(email, receiver_id):
    ns_instance = NotificationSettings.objects.filter(user_id_id=receiver_id).first()
    if ns_instance:
        if (email.get('type') == 'new_message' and ns_instance.message) or (email.get('type') == 'new_match' and ns_instance.match):
            notification_instance = EmailNotification(email, ns_instance.user_id)
            notification_instance()


@shared_task(queue='mlqueue')
def send_message_notification_email():
    time = datetime.datetime.now() - datetime.timedelta(minutes=30)
    messages = ThreadMessage.objects.filter(is_read=False, created_at__lte=time, is_alerted=False).annotate(role=F('sender_user_id__role'))
    distinct_list = messages.values_list('conversation_thread_id', 'role').distinct()

    for thread in distinct_list:
        try:
            conv_thread = ConversationThread.objects.get(id=thread[0])
            email = {
                'type': 'new_message',
                'content': {
                    'job_posting': conv_thread.job_posting_id.title,
                }
            }
            if thread[1] == 'employer':
                messages_content = list(messages.filter(conversation_thread_id=conv_thread, role=thread[1]).values_list('content', flat=True)[:2])
                receiver_user = conv_thread.candidate_user_id
                sender_company = conv_thread.job_posting_id.location_id.company_id
                email['content'].update({'name': f'{sender_company.name}',
                                         'picture': sender_company.logo, 'messages': messages_content})
                send_notification_email(email, receiver_user.id)

            elif thread[1] == 'job_seeker':
                messages_content = list(messages.filter(conversation_thread_id=conv_thread, role=thread[1]).values_list('content', flat=True)[:2])
                email['content'].update({'name': f'{conv_thread.candidate_user_id.first_name} {conv_thread.candidate_user_id.last_name}',
                                         'picture': conv_thread.candidate_user_id.picture, 'messages': messages_content})
                send_notification_email(email, conv_thread.employer_user_id.id)
                receiver_users = ThreadMessage.objects.filter(conversation_thread_id=conv_thread). \
                    exclude(sender_user_id__in=[conv_thread.candidate_user_id, conv_thread.employer_user_id]).distinct('sender_user_id')

                for receiver_user in receiver_users:
                    send_notification_email(email, receiver_user.id)
        except Exception as e:
            print(e)
            pass
    messages.update(is_alerted=True)


@shared_task(queue='mlqueue')
def create_push_notification(device_token, notification_id):
    notification = Notification.objects.get(id=notification_id)
    try:
        notification_body = {
            "title": notification.title,
            "content": notification.content,
            "device_token": device_token
        }
        if send_push_notification(device_token, notification_body):
            notification.sent = True
            notification.save()

    except Exception as e_outer:
        notification.error = str(e_outer)
        notification.save()
