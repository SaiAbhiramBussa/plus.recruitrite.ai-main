## Backend (Django) Overview

The backend is a Django REST API composed of multiple apps with clear domains. Authentication uses `knox` token auth. PostgreSQL stores data; Redis powers Celery and caching.

### Core Settings

```171:180:src/api/startdate/settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config("DB_NAME"),
        'USER': config("DB_USER"),
        'PASSWORD': config("DB_PASSWORD"),
        'HOST': config("DB_HOST"),
        "PORT": 5432,
    }
}
```

```266:299:src/api/startdate/settings.py
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'knox.auth.TokenAuthentication',
     ),
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
        'rest_framework.parsers.JSONParser',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '5/day',
        'user': '500/day'
    }
}
```

### Apps and Responsibilities

- `accounts`: Custom `User` model, auth flows, notifications, messaging notifications
- `candidate`: Candidate profiles, ingestion, Apollo extraction, tagging
- `company`: Companies, locations, industries, membership
- `job_posting`: Job postings, candidate-job relations, processing pipelines
- `conversation_thread`: Messaging threads for job/candidate conversations
- `payment_history`: Subscriptions, webhook processing, entitlements
- `machine_learning`: Ranking pipelines, ML process orchestration
- `model_training`: Model training management
- `powered_by`: External webhook ingestion and processing (parse/rank/save)
- `integrations`: External ATS/partners keys and sync
- `adwerks`: Email campaigns, scrapers, job pulls
- `location`, `filters`, `title_mapping`: Taxonomies/utilities
- `shareable_link`: Candidate sharing links
- `playground`: Throttled playground endpoints
- `celery_jobs`: Generic background jobs/imports/sync

### Example Models

Custom user model with roles and references:

```15:43:src/api/accounts/models.py
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
```

Candidate core fields and relations:

```20:39:src/api/candidate/models.py
class Candidate(SoftDeleteObject, models.Model):
    id = models.UUIDField(primary_key=True, verbose_name='Candidate ID', default=uuid.uuid4, editable=False, db_index=True)
    first_name = models.CharField(max_length=255, blank=False, null=False)
    middle_name = models.CharField(max_length=255, blank=True, null=True)
    credentials = models.TextField(blank=True, null=True)
    last_name = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    business_email = models.EmailField(blank=True, null=True)
    gender = models.CharField(choices=GENDER_CHOICES, max_length=50, blank=True, null=True)
    phone = PhoneNumberField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    profile = models.TextField(unique=True, blank=True, null=True)
    picture = models.TextField(blank=True, null=True)
    summary = models.TextField(blank=True, null=True)
    industry_id = models.ForeignKey('company.Industry', on_delete=models.DO_NOTHING, null=True, blank=True)
    tags = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    user_id = models.ForeignKey('accounts.User', on_delete=models.CASCADE, null=True, blank=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='candidate_created_by',
                                   on_delete=models.DO_NOTHING, null=True, blank=True)
```

Company basics:

```14:29:src/api/company/models.py
class Company(SoftDeleteObject, models.Model):
    id = models.UUIDField(primary_key=True, verbose_name='Company ID', default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True, blank=False, null=False)
    type = models.CharField(max_length=255, null=True, blank=True)
    logo = models.TextField(null=True, blank=True)
    website_url = models.TextField(null=True, blank=True, unique=True)
    industry_id = models.ForeignKey('company.Industry', on_delete=models.DO_NOTHING, null=True, blank=True)
    description = models.TextField(blank=True, null=True)
    subscription_type = models.CharField(max_length=255, null=True, blank=True)
    minimum_reveals = models.IntegerField(null=True,default=25)
    candidate_scope = models.CharField(max_length=50, default='self',choices=SCOPE_CHOICES, blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='company_created_by',
                                   on_delete=models.DO_NOTHING, null=True, blank=True)
```

### Background Jobs (overview)

Celery routes queues by app and schedules periodic jobs.

```19:23:src/api/startdate/celery.py
CELERY_ROUTES = {
    'powered_by.tasks.*': {'queue': 'powered_by'},
    'machine_learning.tasks.*': {'queue': 'mlqueue'},
    'accounts.tasks.*': {'queue': 'mlqueue'}
}
```

See celery.md for full schedules and tasks.


