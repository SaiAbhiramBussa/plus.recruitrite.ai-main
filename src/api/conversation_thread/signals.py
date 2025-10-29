from django.dispatch import Signal
from django.dispatch import receiver
from .models import ThreadMessage
from conversation_thread.services import create_notification_instance

new_message = Signal()


@receiver(new_message)
def handle_message_notification_signal(sender, **kwargs):
    if not isinstance(sender, ThreadMessage):
        return None
    thread = sender.conversation_thread_id

    if sender.sender_user_id != thread.candidate_user_id:
        receiver_user = thread.candidate_user_id

        notification_data = {
            'content': f'New Message from {sender.sender_user_id.first_name+" "+sender.sender_user_id.last_name}',
            'title': 'Message',
            'receiver_user_id': receiver_user,
            'sender_user_id': sender.sender_user_id
        }
        create_notification_instance(receiver_user, notification_data)

    elif sender.sender_user_id == thread.candidate_user_id:
        receiver_user = thread.employer_user_id

        notification_data = {
            'content': f'New Message from {sender.sender_user_id.first_name+" "+sender.sender_user_id.last_name}',
            'title': 'Message',
            'receiver_user_id': receiver_user,
            'sender_user_id': sender.sender_user_id
        }
        create_notification_instance(receiver_user, notification_data)
        receiver_users = ThreadMessage.objects.filter(conversation_thread_id=thread).\
            exclude(sender_user_id__in=[thread.candidate_user_id, thread.employer_user_id]).distinct('sender_user_id')
        for receiver_user in receiver_users:
            notification_data = {
                'content': f'New Message from {sender.sender_user_id.first_name+" "+sender.sender_user_id.last_name}',
                'title': 'Message',
                'receiver_user_id': receiver_user,
                'sender_user_id': sender.sender_user_id
            }
            create_notification_instance(receiver_user, notification_data)
