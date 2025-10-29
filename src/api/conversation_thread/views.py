from django.shortcuts import render
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from accounts.services import StartdateTokenAuthentication
from candidate.models import Candidate
from conversation_thread.models import ConversationThread, ThreadMessage
from conversation_thread.serializers import ConversationThreadCandidateSerializer, JobPostingThreadSerializer, ConversationThreadCreateSerializer, ThreadMessageSerializer, ConversationThreadEmployerSerializer, ThreadMessageCreateSerializer
from job_posting.models import JobPosting
from .services import validate_thread_id
from .signals import new_message
# Create your views here.


class ConversationThreadView(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        user = request.user
        message_type = request.query_params.get('type')
        count = request.query_params.get('get_count')
        job_posting_id = request.query_params.get('job_posting_id')
        candidate_id = request.query_params.get('candidate_id')

        if user.role == 'job_seeker':
            if job_posting_id:
                conversation = ConversationThread.objects.filter(job_posting_id=job_posting_id, candidate_user_id=request.user).first()
                if not conversation:
                    return Response({'Error': 'Conversation Not Found'}, status=status.HTTP_404_NOT_FOUND)
                serializer = ConversationThreadCandidateSerializer(instance=conversation, many=False)
                return Response(serializer.data, status=status.HTTP_200_OK)

            conversations = ConversationThread.objects.filter(candidate_user_id=user)
            if message_type:
                thread_messages_conversation_id = ThreadMessage.objects.filter(conversation_thread_id__in=conversations, type=message_type).distinct('conversation_thread_id').values_list('conversation_thread_id', flat=True)
                conversations = conversations.filter(id__in=thread_messages_conversation_id)
                if count == 'True':
                    return Response({'count': conversations.count()}, status=status.HTTP_200_OK)
            serializer = ConversationThreadCandidateSerializer(instance=conversations, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        elif user.role == 'employer':

            if job_posting_id and candidate_id:
                candidate = Candidate.objects.filter(id=candidate_id).first()
                if not candidate:
                    return Response({'Error': 'Candidate Not Found'}, status=status.HTTP_404_NOT_FOUND)
                if not candidate.user_id:
                    return Response({'Error': 'Candidate has not Signed Up in StartDate'},
                                    status=status.HTTP_405_METHOD_NOT_ALLOWED)
                conversation = ConversationThread.objects.filter(
                    job_posting_id=job_posting_id, candidate_user_id=candidate.user_id).first()
                if not conversation:
                    return Response({'Error': 'Conversation Not Found'}, status=status.HTTP_404_NOT_FOUND)
                serializer = ConversationThreadEmployerSerializer(instance=conversation, many=False)
            elif job_posting_id:
                conversations = ConversationThread.objects.filter(job_posting_id=job_posting_id)
                serializer = ConversationThreadEmployerSerializer(instance=conversations, many=True)
            else:
                conversation_job_postings = ConversationThread.objects.filter(job_posting_id__location_id__company_id=request.user.location_id.company_id).values('job_posting_id')
                # if message_type:
                #     thread_messages_conversation_id = ThreadMessage.objects.filter(conversation_thread_id__in=conversation_job_postings, type=message_type).distinct('conversation_thread_id').values_list('conversation_thread_id', flat=True)
                #     conversation_job_postings = conversation_job_postings.filter(id__in=thread_messages_conversation_id)
                job_postings = JobPosting.objects.filter(id__in=conversation_job_postings)
                serializer = JobPostingThreadSerializer(instance=job_postings, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, job_posting_id):
        data = request.data
        if request.user.role == 'employer':
            employer_user_id = request.user.id
            candidate = Candidate.objects.filter(id=data['candidate_id']).first()
            if not candidate:
                return Response({'Error': 'Candidate Not Found'}, status=status.HTTP_404_NOT_FOUND)
            if not candidate.user_id:
                return Response({'Error': 'Candidate has not Signed Up in StartDate'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)
            data.update({'job_posting_id': job_posting_id, 'employer_user_id': employer_user_id, 'candidate_user_id': candidate.user_id.id})
        if request.user.role == 'job_seeker':
            candidate_user_id = request.user.id
            jp = JobPosting.objects.filter(id=job_posting_id).first()
            if not jp.created_by:
                return Response({'Error': 'Something went wrong'}, status=status.HTTP_404_NOT_FOUND)

            data.update({'job_posting_id': job_posting_id, 'employer_user_id': jp.created_by.id,
                         'candidate_user_id': candidate_user_id})
        serializer = ConversationThreadCreateSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ThreadMessageView(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (IsAuthenticated,)

    def get(self, request, thread_id):
        validation_response = validate_thread_id(request, thread_id)
        if isinstance(validation_response, Response):
            return validation_response

        messages = ThreadMessage.objects.filter(conversation_thread_id=thread_id).order_by('-created_at')
        serializer = ThreadMessageSerializer(instance=messages, many=True)
        grouped_data = {}
        for entry in serializer.data:
            created_at = entry['created_at'].split('T')[0]
            grouped_data.setdefault(created_at, []).append(entry)
        grouped_list = []
        keys = list(grouped_data.keys())
        for key in keys:
            grouped_list.append({'date': key, 'messages': grouped_data[key]})

        return Response(grouped_list, status=status.HTTP_200_OK)

    def post(self, request, thread_id):
        validation_response = validate_thread_id(request, thread_id)

        if isinstance(validation_response, Response):
            return validation_response

        data = request.data
        data.update({'sender_user_id': request.user.id,
                    'conversation_thread_id': thread_id})

        serializer = ThreadMessageCreateSerializer(data=data)
        if serializer.is_valid():
            saved_object = serializer.save()
            new_message.send(sender=saved_object)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, thread_id):
        validation_response = validate_thread_id(request, thread_id)

        if isinstance(validation_response, Response):
            return validation_response
        try:
            if request.user.role == 'employer':
                ThreadMessage.objects.filter(conversation_thread_id=validation_response, sender_user_id=validation_response.candidate_user_id, is_read=False).update(is_read=True)

            if request.user.role == 'job_seeker':
                ThreadMessage.objects.filter(conversation_thread_id=validation_response, is_read=False)\
                    .exclude(sender_user_id=validation_response.candidate_user_id).update(is_read=True)

            return Response(status=status.HTTP_200_OK)
        except:
            return Response(status=status.HTTP_400_BAD_REQUEST)


class MessageBaseView(APIView):
    authentication_classes = (StartdateTokenAuthentication,)
    permission_classes = (IsAuthenticated,)

    def patch(self, request, thread_id, message_id):
        validation_response = validate_thread_id(request, thread_id)
        if isinstance(validation_response, Response):
            return validation_response

        message = ThreadMessage.objects.filter(id=message_id).first()
        if not message:
            return Response({'Error': 'Message Id Invalid'}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data
        serializer = ThreadMessageCreateSerializer(instance=message, data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
