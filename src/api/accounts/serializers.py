from django.contrib.auth import get_user_model
from rest_framework import serializers
from accounts import models
from accounts.models import User, UserCredits
from conversation_thread.models import Notification
from location.serializers import LocationSerializer
User = get_user_model()


class LoginSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.User
        fields = ['email', 'password']


class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.User
        fields = ['id', 'email', 'password',
                  'first_name', 'last_name', 'location_id', 'role']

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            password=validated_data['password'],
            location_id=validated_data['location_id'],
            role=validated_data['role']
        )
        user.save()
        if(user.role == 'hiring_manager'):
            credits=0
            UserCredits.objects.create(email=validated_data["email"], user=user, company=user.location_id.company_id, credits=credits)
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.User
        fields = ['email', 'password', 'first_name', 'last_name', 'role']


class UserCandidateProfileViewSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.User
        fields = ['first_name', 'last_name']


class AdminCreateUserSerializer(serializers.ModelSerializer):
    def validate(self, data):
        if not data['first_name']:
            raise serializers.ValidationError("first_name cannot be empty")
        if 'location_id' not in data or not data['location_id']:
            raise serializers.ValidationError("location_id cannot be empty")
        return data

    class Meta:
        model = models.User
        fields = ['id', 'first_name', 'last_name', 'email', 'role', 'title', 'location_id', 'password', 'created_by', 'phone']


class AdminGetUserSerializer(serializers.ModelSerializer):
    location = LocationSerializer(many=False, source='location_id')

    class Meta:
        model = models.User
        fields = ['id', 'first_name', 'last_name', 'email', 'title', 'location', 'created_by', 'phone', 'created_at']


class DeviceTokenUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.User
        fields = ['id', 'first_name', 'last_name', 'title', 'phone', 'device_token']


class NotificationSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.NotificationSettings
        fields = ['id', 'user_id', 'type', 'message', 'match']


class NotificationsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'content', 'title', 'type', 'created_at', 'receiver_user_id', 'sender_user_id', 'is_read']

class FetchEmployeesSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.User
        fields = ['id', "email"]


class ShareCreditSerializer(serializers.Serializer):
    credits = serializers.IntegerField(required=True)
    emails = serializers.ListField(required=True, min_length=1)