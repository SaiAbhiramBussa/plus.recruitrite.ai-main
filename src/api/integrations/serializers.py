from integrations import models
from rest_framework import serializers
from django.db.models import Sum
from powered_by.models import PoweredByRequest


class IntegrationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.IntegrationKey
        fields = ['id', 'key', 'type', 'company_id', 'created_by', 'updated_by', 'is_active', 'created_at']


class IntegrationUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.IntegrationKey
        fields = ['type', 'credentials']


class IntegrationRetrieveSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.IntegrationKey
        fields = ['id', 'key', 'type', 'company_id', 'created_by', 'updated_by', 'created_at', 'updated_at', 'is_active']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        credits_used = PoweredByRequest.objects.filter(api_key=instance.key).aggregate(credits_used=Sum('credits_used'))
        representation.update(credits_used)
        return representation
