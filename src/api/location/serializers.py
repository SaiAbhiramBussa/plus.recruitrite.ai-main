from company import models
from rest_framework import serializers
from accounts.models import User


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Location
        fields = ['id', 'address', 'city', 'state', 'zip', 'country', 'company_id']


class UserOfLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'phone']


class LocationWithUsersSerializer(serializers.ModelSerializer):
    users = UserOfLocationSerializer(many=True, source='user_set')

    class Meta:
        model = models.Location
        fields = ['id', 'address', 'city', 'state', 'zip', 'country', 'users']


class AdminUpdateLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Location
        fields = ['address', 'city', 'state', 'zip', 'country']
