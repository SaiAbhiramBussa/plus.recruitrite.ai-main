from rest_framework import status
from conversation_thread.models import ConversationThread, Notification
from rest_framework.response import Response
from decouple import config
from accounts.tasks import create_push_notification

EXPO_TOKEN = config('EXPO_TOKEN')


def validate_thread_id(request, thread_id):
    thread = ConversationThread.objects.filter(id=thread_id).first()
    if not thread:
        return Response({'Error': 'Conversation Thread Not Found'}, status=status.HTTP_404_NOT_FOUND)
    if request.user.role == 'job_seeker' and thread.candidate_user_id.id != request.user.id:
        return Response({'Error': 'Access to Conversation Thread Forbidden'}, status=status.HTTP_403_FORBIDDEN)
    if request.user.role == 'employer' and request.user.location_id.company_id != thread.job_posting_id.location_id.company_id:
        return Response({'Error': 'Access to Conversation Thread Forbidden'}, status=status.HTTP_403_FORBIDDEN)
    return thread


def create_notification_instance(receiver_user, notification_data):
    device_token = receiver_user.device_token
    if device_token:
        notification = Notification.objects.create(**notification_data)
        create_push_notification.delay(device_token, notification.id)
