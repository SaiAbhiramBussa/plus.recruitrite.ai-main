import uuid
from phonenumber_field.modelfields import PhoneNumberField
from django.db import models
from softdelete.models import SoftDeleteObject
from startdate import settings


class Candidate(SoftDeleteObject, models.Model):

    GENDER_CHOICES = (
        ('male', 'male'),
        ('female', 'female'),
        ('other', 'other'),
    )
    STATUS_CHOICES = (
        ('active', 'active'),
        ('inactive', 'inactive'),
    )

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
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='candidate_updated_by', null=True,
                                   blank=True, on_delete=models.DO_NOTHING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    external_id = models.CharField(max_length=255, blank=True, null=True, unique=True)
    source = models.CharField(max_length=255, blank=True, null=True)
    ai_candidate_id = models.UUIDField(verbose_name='AI Generated Candidate ID', editable=False , null=True, db_index=True)
    staged = models.CharField(max_length=100, blank=True, null=True)
    processed_by_extension = models.BooleanField(default=False)

    class Meta:
        db_table = "candidate"


class CandidateAttributes(SoftDeleteObject, models.Model):
    id = models.UUIDField(primary_key=True, verbose_name='Candidate Attributes ID', default=uuid.uuid4, editable=False)
    address = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=255, blank=True, null=True)
    country = models.CharField(max_length=255, blank=True, null=True)
    state = models.CharField(max_length=255, blank=True, null=True)
    zip = models.BigIntegerField(blank=True, null=True)
    candidate_id = models.ForeignKey('candidate.Candidate', on_delete=models.CASCADE, blank=True, null=True)

    class Meta:
        db_table = "candidate_attributes"


class CandidateWorkHistory(SoftDeleteObject, models.Model):
    id = models.UUIDField(primary_key=True, verbose_name='Candidate WorkHistory ID', default=uuid.uuid4,
                          editable=False)
    company_id = models.ForeignKey('company.Company', on_delete=models.CASCADE, null=True, blank=True)
    location_id = models.ForeignKey('company.Location', on_delete=models.CASCADE, null=True, blank=True)
    candidate_id = models.ForeignKey('candidate.Candidate', on_delete=models.CASCADE, blank=True, null=True)
    title = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    from_date = models.DateField(blank=True, null=True)
    to_date = models.DateField(blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='workhistory_created_by',
                                  on_delete=models.DO_NOTHING, null=True, blank=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='workhistory_updated_by', null=True,
                                  blank=True, on_delete=models.DO_NOTHING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "candidate_work_history"
        unique_together = ['title', 'company_id', 'candidate_id', 'from_date']


class CandidateEducationHistory(SoftDeleteObject, models.Model):
    id = models.UUIDField(primary_key=True, verbose_name='Candidate EducationHistory ID', default=uuid.uuid4,
                          editable=False)
    name = models.CharField(max_length=255, null=True, blank=True)
    degree = models.CharField(max_length=255, null=True, blank=True)
    field = models.CharField(max_length=255, null=True, blank=True)
    from_date = models.DateField(blank=True, null=True)
    to_date = models.DateField(blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='educationhistory_created_by',
                                  on_delete=models.DO_NOTHING, null=True, blank=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='educationhistory_updated_by', null=True,
                                  blank=True, on_delete=models.DO_NOTHING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    candidate_id = models.ForeignKey('candidate.Candidate', on_delete=models.CASCADE, blank=True, null=True)

    class Meta:
        db_table = "candidate_education_history"


class CandidateSkill(SoftDeleteObject, models.Model):
    candidate_id = models.ForeignKey('candidate.Candidate',  on_delete=models.CASCADE, blank=True, null=True)
    skill_id = models.ForeignKey('job_posting.SKill', on_delete=models.CASCADE, blank=True, null=True)

    class Meta:
        db_table = "candidate_skill"


class Resumes(SoftDeleteObject, models.Model):
    id = models.UUIDField(primary_key=True, verbose_name='Resume Id', default=uuid.uuid4, editable=False)
    candidate_id = models.ForeignKey('candidate.Candidate', on_delete=models.CASCADE, blank=True, null=True)
    key = models.TextField(blank=False, null=False)
    type = models.CharField(max_length=200, blank=False, null=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "resumes"


class CandidateExternalId(SoftDeleteObject, models.Model):
    id = models.UUIDField(primary_key=True, verbose_name='Candidate External Reference Id', default=uuid.uuid4, editable=False)
    candidate_id = models.ForeignKey('candidate.Candidate', on_delete=models.CASCADE, blank=False, null=False)
    value = models.CharField(max_length=255, blank=False, null=False)
    system = models.CharField(max_length=100, blank=False, null=False)

    class Meta:
        db_table = "candidate_external_id"


class ATSCandidates(SoftDeleteObject, models.Model):
    id = models.UUIDField(primary_key=True, verbose_name='ATS Candidate Id', default=uuid.uuid4, editable=False)
    candidate_id = models.ForeignKey('candidate.Candidate', on_delete=models.CASCADE, blank=False, null=False)
    job_posting_id = models.ForeignKey("job_posting.JobPosting", on_delete=models.CASCADE, blank=True, null=True)

    class Meta:
        db_table = "ats_candidates"


class CandidateMaskSettings(models.Model):
    id = models.UUIDField(primary_key=True, verbose_name='Candidate Mask Settings Id', default=uuid.uuid4, editable=False)
    candidate_id = models.ForeignKey('candidate.Candidate', on_delete=models.CASCADE, blank=False, null=False)
    name = models.BooleanField(default=False)
    current_company = models.BooleanField(default=False)
    current_title = models.BooleanField(default=False)
    video_resume = models.BooleanField(default=False)
    resume = models.BooleanField(default=False)
    picture = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    contact = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "candidate_mask_settings"


class UnmaskedCandidateJobPosting(models.Model):
    id = models.UUIDField(primary_key=True, verbose_name='Unmasked Candidate Job Posting Id', default=uuid.uuid4, editable=False)
    candidate_id = models.ForeignKey('candidate.Candidate', on_delete=models.CASCADE, blank=False, null=False)
    job_posting_id = models.ForeignKey("job_posting.JobPosting", on_delete=models.CASCADE, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "unmasked_candidate_job_posting"
