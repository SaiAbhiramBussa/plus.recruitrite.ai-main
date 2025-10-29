import uuid
from django.db import models
from softdelete.models import SoftDeleteObject
from startdate import settings


class Company(SoftDeleteObject, models.Model):
    SCOPE_CHOICES = (
        ('all', 'all'),
        ('self', 'self'),
        ('others', 'others'),
    )
    
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
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='company_updated_by', null=True,
                                   blank=True, on_delete=models.DO_NOTHING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    benefits = models.TextField(null=True, blank=True)
    values = models.TextField(null=True, blank=True)
    employees = models.CharField(max_length=255, null=True, blank=True)
    business_type = models.TextField(null=True, blank=True)

    class Meta:
        db_table = "company"


class Location(SoftDeleteObject, models.Model):
    id = models.UUIDField(primary_key=True, verbose_name='Location ID', default=uuid.uuid4, editable=False)
    address = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=255, blank=True, null=True)
    country = models.CharField(max_length=255, blank=True, null=True)
    state = models.CharField(max_length=255, blank=True, null=True)
    zip = models.BigIntegerField(blank=True, null=True)
    company_id = models.ForeignKey('company.Company', on_delete=models.CASCADE, null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='location_created_by',
                                   on_delete=models.DO_NOTHING, null=True, blank=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='location_updated_by', null=True,
                                   blank=True, on_delete=models.DO_NOTHING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "location"


class Industry(SoftDeleteObject, models.Model):
    id = models.UUIDField(primary_key=True, verbose_name='Industry ID', default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255, unique=True, blank=False, null=False)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='industry_created_by',
                                   on_delete=models.DO_NOTHING, null=True, blank=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='industry_updated_by', null=True,
                                   blank=True, on_delete=models.DO_NOTHING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "industry"


class Subscription(SoftDeleteObject, models.Model):
    id = models.UUIDField(primary_key=True, verbose_name='Subscription ID', default=uuid.uuid4, editable=False)
    payment_history_id = models.ForeignKey('payment_history.Payment_history', on_delete=models.DO_NOTHING, null=True, blank=True)
    company_id = models.ForeignKey('company.Company', on_delete=models.CASCADE, null=True, blank=True)
    type = models.CharField(max_length=255, null=True, blank=True)
    reveals = models.IntegerField(blank=True, null=True)
    reveals_left = models.IntegerField(blank=True, null=True)
    is_expired = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    job_posting_id = models.ForeignKey('job_posting.JobPosting',  on_delete=models.CASCADE, blank=True, null=True)
    start_date = models.DateTimeField(blank=True, null=True)
    end_date = models.DateTimeField(blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='subscription_created_by',
                                   on_delete=models.DO_NOTHING, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='subscription_updated_by', null=True,
                                   blank=True, on_delete=models.DO_NOTHING)

    class Meta:
        db_table = "subscription"


class Follows(SoftDeleteObject, models.Model):
    id = models.UUIDField(primary_key=True, verbose_name='Follow ID', default=uuid.uuid4, editable=False)
    follow_id = models.UUIDField(blank=True, null=True)
    follow_type = models.CharField(max_length=255, null=True, blank=True)
    candidate_id = models.ForeignKey('candidate.Candidate', on_delete=models.CASCADE, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "follows"


class KanbanBoard(SoftDeleteObject, models.Model):
    id = models.UUIDField(primary_key=True, verbose_name='Kanban Board Stage ID', default=uuid.uuid4, editable=False)
    company_id = models.ForeignKey('company.Company', on_delete=models.CASCADE, null=True, blank=True)
    stage_name = models.CharField(max_length=255, null=True, blank=True)
    order = models.IntegerField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='stage_created_by',
                                   on_delete=models.DO_NOTHING, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='stage_updated_by', null=True,
                                   blank=True, on_delete=models.DO_NOTHING)

    class Meta:
        db_table = "kanban_board"


class CompaniesCandidates(SoftDeleteObject, models.Model):
    id = models.UUIDField(primary_key=True, verbose_name='Companies Candidate Id', default=uuid.uuid4, editable=False)
    company_id = models.ForeignKey('company.Company', on_delete=models.CASCADE, null=True, blank=True)
    candidate_id = models.ForeignKey('candidate.Candidate', on_delete=models.CASCADE, blank=True, null=True)

    class Meta:
        db_table = "companies_candidates"


class ImportStats(models.Model):
    id = models.UUIDField(primary_key=True, verbose_name='Import Stats Id', default=uuid.uuid4, editable=False)
    company_id = models.ForeignKey('company.Company', on_delete=models.CASCADE, null=True, blank=True)
    type = models.CharField(max_length=100, null=True, blank=True)
    total_count = models.BigIntegerField(null=True, blank=True)
    inserted = models.BigIntegerField(null=True, blank=True)
    updated = models.BigIntegerField(null=True, blank=True)
    failed = models.BigIntegerField(null=True, blank=True)
    exception_log = models.TextField(null=True, blank=True)
    process_log = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "import_stats"
