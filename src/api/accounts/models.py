from django.db.models.signals import pre_save
from django.dispatch import receiver
from dynaconf import ValidationError
from phonenumber_field.modelfields import PhoneNumberField
from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid
from django.utils import timezone
from softdelete.models import SoftDeleteObject

from startdate import settings
from .managers import UserManager


class User(SoftDeleteObject, AbstractUser):

    ROLE_CHOICES = (
        ('employer', 'employer'),
        ('job_seeker', 'job_seeker'),
        ('admin', 'admin'),
        ('hiring_manager','hiring_manager')
    )

    id = models.UUIDField(primary_key=True, verbose_name='User ID', default=uuid.uuid4, editable=False)
    username = None
    date_joined = None
    email = models.EmailField(unique=True)
    last_logged_in = models.DateTimeField(blank=True, null=True)
    log_in_count = models.BigIntegerField(blank=True, null=True)
    picture = models.TextField(blank=True, null=True)
    phone = PhoneNumberField(blank=True, null=True)
    location_id = models.ForeignKey('company.Location', on_delete=models.CASCADE, null=True, blank=True)
    role = models.CharField(max_length=100, choices=ROLE_CHOICES, blank=True, null=True)
    title = models.CharField(max_length=100, blank=True, null=True)
    status = models.BooleanField(blank=True, null=True)
    otp = models.CharField(max_length=6)
    otp_generated_at = models.DateTimeField(default=timezone.now)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='user_created_by',
                                   on_delete=models.DO_NOTHING, null=True, blank=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='user_updated_by', null=True,
                                   blank=True, on_delete=models.DO_NOTHING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    device_token = models.TextField(null=True, blank=True)
    refresh_token = models.CharField(max_length=255, null=True, blank=True)
    language = models.CharField(max_length=255, null=True, blank=True, default='en')
    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    ordering = ('email',)

    class Meta:
        db_table = "user"

    def __str__(self):
        return self.first_name


class NotificationSettings(models.Model):
    id = models.UUIDField(
        primary_key=True, verbose_name="Notification Settings Id", default=uuid.uuid4, editable=False
    )
    user_id = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="user",
        on_delete=models.DO_NOTHING,
        null=True,
        blank=True,
    )
    type = models.CharField(max_length=50, default='email')
    message = models.BooleanField(default=True)
    match = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "notification_settings"


@receiver(pre_save, sender=User)
def your_model_pre_save(sender, instance, **kwargs):
    if instance.id:
        instance.email = str.lower(instance.email)
        users = User.objects.filter(email=instance.email)
        if len(users) > 0 and users.first().id != instance.id:
            raise ValidationError(
                instance.email + " email already exists"
            )

class UserCredits(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, null=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    email = models.EmailField()
    credits = models.PositiveIntegerField(default=0)
    company = models.ForeignKey('company.Company', on_delete=models.DO_NOTHING)

    class Meta:
        db_table = "user_credits"

