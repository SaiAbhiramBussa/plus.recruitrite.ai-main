from filters import models
from rest_framework import serializers


class FilterSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Filter
        fields = ['id', 'content', 'candidate_id', 'created_by', 'created_at', 'updated_at']


class FilterReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Filter
        fields = ['id', 'content', 'created_at', 'updated_at']
