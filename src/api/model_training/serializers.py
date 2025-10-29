from rest_framework import serializers
from . import models
from company.models import Company, Location
from job_posting.models import JobPosting


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ["id", "name"]


class LocationSerializer(serializers.ModelSerializer):
    company_id = CompanySerializer(read_only=True)

    class Meta:
        model = Location
        fields = ["id", "address", "company_id"]


class JobPostingSerializer(serializers.ModelSerializer):
    location_id = LocationSerializer(read_only=True)

    class Meta:
        model = JobPosting
        fields = ["id", "title", "location_id"]


class ModelTrainingSerializer(serializers.ModelSerializer):
    updated_at = serializers.DateTimeField(format="%m/%d/%Y", read_only=True)
    company_id = serializers.SerializerMethodField()

    class Meta:
        model = models.TrainedTitle
        fields = [
            "id",
            "title",
            "job_posting_id",
            "status",
            "major_version",
            "minor_version",
            "is_active",
            "model_s3_path",
            "updated_at",
            "company_id",
        ]

    def get_company_id(self, obj):
        return obj.job_posting_id.location_id.company_id.id
