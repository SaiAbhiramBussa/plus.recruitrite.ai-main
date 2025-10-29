from rest_framework import serializers
from . import models


class IndustrySerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Industry
        fields = ['id', 'title']


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Company
        fields = ['name']

    def create(self, validated_data):
        company = models.Company(
            name=validated_data['name'],
        )
        company.save()
        return company


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Location
        fields = ['id', 'state', 'zip', 'company_id', 'city', 'country', 'address']

        def create(self, validated_data):
            location = models.Location(
                state=validated_data['state'],
                zip=validated_data['zip'],

            )
            location.save()
            return location


class ApolloCompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Company
        fields = ['name']


class CompanyForAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Company
        fields = ['id', 'name', 'created_at', 'created_by']


class AdminCreateCompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Company
        fields = ['id', 'name', 'logo', 'description', 'created_by', 'industry_id', 'subscription_type', 'website_url', 'values', 'benefits', 'employees', 'business_type']


class AdminGetCompanySerializer(serializers.ModelSerializer):
    industry = IndustrySerializer(many=False, source='industry_id')

    class Meta:
        model = models.Company
        fields = ['id', 'name', 'logo', 'description', 'created_by', 'industry', 'subscription_type', 'website_url', 'values', 'benefits', 'employees', 'business_type']


class ImportStatsSerializer(serializers.ModelSerializer):
    company = CompanySerializer(many=False, source='company_id')

    class Meta:
        model = models.ImportStats
        fields = ['id', 'type', 'total_count', 'inserted', 'updated', 'failed', 'exception_log', 'process_log', 'company', 'created_at', 'updated_at']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if representation.get('company'):
            company = {'company': representation.get('company').get('name')}
            representation.update(company)
        return representation
