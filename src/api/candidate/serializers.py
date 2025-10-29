from . import models
from rest_framework import serializers
from .models import Candidate


class CandidateForAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Candidate
        fields = ['id', 'first_name', 'last_name',
                  'email', 'phone', 'picture', 'address', 'profile', 'tags']


class CandidateSkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.CandidateSkill
        fields = ['skill_id', 'candidate_id']


class ApolloCandidateSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Candidate
        fields = ['first_name', 'last_name', 'profile', 'email',
                  'phone', 'picture', 'source', 'external_id']

    def get_or_create(self):
        defaults = self.validated_data.copy()
        return Candidate.objects.get_or_create(defaults=defaults)


class ApolloCandidateAttributesSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.CandidateAttributes
        fields = ['city', 'state', 'country', 'candidate_id']


class ApolloCandidateWorkHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = models.CandidateWorkHistory
        fields = ['title', 'description',
                  'from_date', 'candidate_id', 'company_id']


class CandidateProfileViewSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Candidate
        fields = ['first_name', 'last_name', 'phone', 'profile', 'summary', 'tags', 'notes', 'source', 'credentials', 'email', 'business_email']


class CandidateAttributesProfileViewSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.CandidateAttributes
        fields = ['city', 'state', 'country', 'candidate_id', 'address']


class CandidateWorkHistoryProfileViewSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.CandidateWorkHistory
        fields = ['title', 'from_date', 'to_date', 'description', 'company_id', 'candidate_id', 'company_id']


class CandidateEducationHistoryProfileViewSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.CandidateEducationHistory
        fields = ['name', 'degree', 'field', 'from_date', 'to_date', 'candidate_id']


class CandidateRegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Candidate
        fields = ['first_name', 'last_name', 'user_id', 'email', 'source']


class CandidateAttributesRegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.CandidateAttributes
        fields = ['city', 'state', 'candidate_id']


class CandidateMaskSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.CandidateMaskSettings
        fields = ['candidate_id', 'name', 'current_company', 'current_title', 'video_resume', 'resume', 'picture', 'contact', 'is_active']
