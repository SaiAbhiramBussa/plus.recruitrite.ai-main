from candidate.services import job_posting_match_skill
from rest_framework import serializers

from candidate.aws import get_presigned_url
from . import models
from company.models import Location
from candidate.models import Candidate, CandidateSkill
from .models import JobPostingSkill
from django.conf import settings


class OfferSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.JobPosting
        fields = [
            "id",
            "title",
            "compensation",
            "status",
            "work_location_type",
            "description",
            "location_id",
            "job_industry",
            "created_by",
            "updated_by",
            "remote_type",
            "city",
            "state",
            "country",
            "zip",
            "source",
            "created_at"
        ]


class OfferAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.JobPosting
        fields = [
            "id",
            "title",
            "compensation",
            "status",
            "work_location_type",
            "description",
            "location_id",
            "created_by",
            "updated_by",
            "remote_type",
            "city",
            "state",
            "country",
            "zip",
            "minimum_match",
        ]


class JobPostingSkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.JobPostingSkill
        fields = ["skill_id", "job_posting_id"]


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Skill
        fields = ["name"]


class LocationFromJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ["state", "company_id", "city", "country"]


class LocationUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ["state", "city", "country"]


class CandidateSkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = CandidateSkill
        fields = ["candidate_id", "skill_id"]


class JobPostingTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.JobPostingTemplate
        fields = ["id", "title", "skill", "description", "industry_id", "company_id", "created_at"]


class CandidateAppliedJobsSerializer(serializers.ModelSerializer):
    job_details = OfferSerializer(many=False, source='job_posting_id')

    class Meta:
        model = models.JobPostingCandidate
        fields = ["id", "job_posting_id", "candidate_id", 'job_details', 'accuracy', 'source']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        company = instance.job_posting_id.location_id.company_id
        representation.update({'company_id': company.id, 'company_name': company.name, 'company_logo': company.logo})
        jp_skills = JobPostingSkill.objects.filter(job_posting_id=instance.job_posting_id)
        jp_skills_list = [item.skill_id.name for item in jp_skills]
        representation.update({'job_skills': jp_skills_list})
        recommended_skill = job_posting_match_skill(instance.candidate_id, instance.job_posting_id, False)
        if recommended_skill:
            representation.update({'recommended_skill': recommended_skill})
        if representation.get('job_details'):
            job_details = representation.get('job_details')
            del job_details['id']
            representation.update(job_details)
            del representation['job_details']
        if instance.hiring_stage_id:
            representation.update({'hiring_stage_name': instance.hiring_stage_id.stage_name})
        return representation


class JobOtherCandidatesSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.JobPosting
        fields = [
            "id",
            "title",
            "city",
            "state",
            "country",
            "zip",
        ]


class OtherCandidatesGetSerializer(serializers.ModelSerializer):
    job_posting = JobOtherCandidatesSerializer(many=False, source='job_posting_id')

    class Meta:
        model = models.OtherCandidates
        fields = ["id", "job_posting", "created_at", 'updated_at', 'inserted', 'failed', 'error']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        file_url = get_presigned_url(settings.AWS_STORAGE_BUCKET_NAME, instance.key, expiration=1800)
        representation.update({'file': file_url})
        return representation


class JobPostingWeightsSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.JobPostingLabelWeight
        fields = ["id", "type", "weightage", "job_posting_id", "created_at", 'updated_at']
