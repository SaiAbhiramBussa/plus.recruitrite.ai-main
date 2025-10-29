from powered_by import models
from rest_framework import serializers

from powered_by.services import powered_by_request_processing_status


class PoweredByRequestGetSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.PoweredByRequest
        fields = ['id', 'request_headers', 'request_method', 'request_body', 'api_response', 'api_key', 'host', 'credits_used', 'created_at', 'processing_status', 'model']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['processing_time'] = None
        if not instance.processing_status or not instance.processing_status == 'Completed':
            status = powered_by_request_processing_status(instance)
            instance.processing_status = status
            instance.save()
            representation['processing_status'] = status
        if instance.processing_status == 'Completed' and instance.completed_at:
            representation['processing_time'] = (instance.completed_at - instance.created_at).total_seconds()
        return representation
