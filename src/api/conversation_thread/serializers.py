from rest_framework import serializers

from candidate.models import Candidate
from .models import ThreadMessage, ConversationThread, Notification
from job_posting.models import JobPosting, JobPostingCandidate
from accounts.models import User


class ConversationUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'picture']


class ThreadMessageCreateSerializer(serializers.ModelSerializer):

    class Meta:
        model = ThreadMessage
        fields = ["id", "content", "sender_user_id", 'conversation_thread_id', 'created_at', 'updated_at', 'type', 'is_read']


class ThreadMessageSerializer(serializers.ModelSerializer):
    sender = ConversationUserSerializer(many=False, source='sender_user_id')

    class Meta:
        model = ThreadMessage
        fields = ["id", "content", "sender", 'conversation_thread_id', 'created_at', 'updated_at', 'type', 'is_read']


class ConversationThreadCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConversationThread
        fields = ["id", "candidate_user_id", 'employer_user_id', 'job_posting_id', 'status', 'created_at', 'updated_at']


class ConversationThreadCandidateSerializer(serializers.ModelSerializer):

    class Meta:
        model = ConversationThread
        fields = ["id", "candidate_user_id", 'job_posting_id', 'status', 'updated_at']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        company = instance.job_posting_id.location_id.company_id
        unread_count = ThreadMessage.objects.filter(conversation_thread_id=instance, is_read=False).exclude(sender_user_id=instance.candidate_user_id).count()
        representation.update({'company_id': company.id, 'company_name': company.name, 'company_logo': company.logo, 'unread_count': unread_count, 'job_posting_title': instance.job_posting_id.title, 'job_posting_id': instance.job_posting_id.id })
        return representation


class ConversationThreadEmployerSerializer(serializers.ModelSerializer):
    candidate = ConversationUserSerializer(many=False, source='candidate_user_id')

    class Meta:
        model = ConversationThread
        fields = ["id", "candidate", 'employer_user_id']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        unread_count = ThreadMessage.objects.filter(conversation_thread_id=instance, sender_user_id=instance.candidate_user_id, is_read=False).count()
        candidate = Candidate.objects.get(user_id=instance.candidate_user_id)
        job_posting_candidate = JobPostingCandidate.objects.filter(job_posting_id=instance.job_posting_id, candidate_id=candidate).first()
        representation.update({'candidate_id': candidate.id, 'unread_count': unread_count, 'hiring_stage_name': job_posting_candidate.hiring_stage_id.stage_name if job_posting_candidate.hiring_stage_id else None, 'job_posting_id': instance.job_posting_id.id})
        return representation


class JobPostingThreadSerializer(serializers.ModelSerializer):

    class Meta:
        model = JobPosting
        fields = ["id", 'title', 'city', 'state', 'country', 'zip']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        thread_count = ConversationThread.objects.filter(job_posting_id=instance).count()
        representation.update({'thread_count': thread_count})
        return representation
