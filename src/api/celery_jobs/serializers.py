from rest_framework import serializers
from . import models


class BackgroundJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.BackgroundJob
        fields = ['name', 'key', 'status']


class ApolloJobRecordsSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ApolloJobRecords
        fields = ['records_inserted', 'records_updated', 'records_failed']


class ApolloJobsBackgroundSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ApolloJobs
        fields = ['id', 'api_key', 'apollo_job', 'page_number', 'fetch_limit', 'status', 'apollo_api_titles',
                  'created_by', 'updated_by', 'apollo_api_locations', 'apollo_account_label_ids']


class CombinedApolloSerializer(serializers.Serializer):
    def get_data(self, instance):
        serializer = ApolloJobsBackgroundSerializer(instance, many=True)
        record_serializer = ApolloJobRecordsSerializer(instance, many=True)
        data_a = serializer.data
        data_b = record_serializer.data
        combined_data = []
        for i in range(len(data_a)):
            combined_data.append({**data_a[i], **data_b[i]})
        return combined_data