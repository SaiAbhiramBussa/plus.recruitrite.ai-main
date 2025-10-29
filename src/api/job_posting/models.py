from django.db import models
import uuid
from softdelete.models import SoftDeleteObject
from django.core.validators import MinValueValidator, MaxValueValidator
from machine_learning.models import MLTrainingData
from startdate import settings
from django.core.exceptions import ValidationError
from django.db.models.signals import pre_save
from django.dispatch import receiver


class JobPosting(SoftDeleteObject, models.Model):
    WORK_LOCATION_TYPE_CHOICES = (
        ("onsite", "onsite"),
        ("hybrid", "hybrid"),
        ("remote", "remote"),
    )
    CONTRACT_TYPE_CHOICES = (
        ("fulltime", "fulltime"),
        ("contract", "contract"),
        ("intern", "intern"),
    )
    STATUS_CHOICES = (
        ("active", "active"),
        ("inactive", "inactive"),
    )
    REMOTE_TYPE_CHOICES = (
        ("state", "state"),
        ("country", "country"),
        ("any_region", "any_region"),
    )
    SOURCE_CHOICES = (
        ("adwerks", "adwerks"),
        ("ats", "ats"),
        ("portal", "portal"),
    )
    id = models.UUIDField(
        primary_key=True,
        verbose_name="Job Posting ID",
        default=uuid.uuid4,
        editable=False,
    )
    title = models.CharField(max_length=255, blank=True, null=True)
    compensation = models.BigIntegerField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    location_id = models.ForeignKey(
        "company.Location", on_delete=models.CASCADE, blank=True, null=True
    )
    work_location_type = models.CharField(
        choices=WORK_LOCATION_TYPE_CHOICES, max_length=255, blank=True, null=True
    )
    job_industry = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(
        choices=STATUS_CHOICES, max_length=255, blank=True, null=True
    )
    contract_type = models.CharField(
        choices=CONTRACT_TYPE_CHOICES, max_length=255, blank=True, null=True
    )
    remote_type = models.CharField(
        choices=REMOTE_TYPE_CHOICES, max_length=100, blank=True, null=True
    )
    source = models.CharField(
        choices=SOURCE_CHOICES, max_length=100, blank=True, default="portal"
    )
    city = models.CharField(max_length=255, blank=True, null=True)
    country = models.CharField(max_length=255, blank=True, null=True)
    state = models.CharField(max_length=255, blank=True, null=True)
    zip = models.BigIntegerField(blank=True, null=True)
    external_id = models.CharField(max_length=255, blank=True, null=True, unique=True)
    minimum_match = models.BigIntegerField(blank=False, null=False, default=35)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="jobposting_created_by",
        on_delete=models.DO_NOTHING,
        null=True,
        blank=True,
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="jobposting_updated_by",
        null=True,
        blank=True,
        on_delete=models.DO_NOTHING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "job_posting"


class Skill(SoftDeleteObject, models.Model):
    id = models.UUIDField(
        primary_key=True, verbose_name="Skill ID", default=uuid.uuid4, editable=False
    )
    name = models.CharField(max_length=255, unique=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="skill_created_by",
        on_delete=models.DO_NOTHING,
        null=True,
        blank=True,
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="skill_updated_by",
        null=True,
        blank=True,
        on_delete=models.DO_NOTHING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "skill"


class JobPostingSkill(SoftDeleteObject, models.Model):
    job_posting_id = models.ForeignKey(
        "job_posting.JobPosting", on_delete=models.CASCADE, blank=True, null=True
    )
    skill_id = models.ForeignKey(
        "job_posting.SKill", on_delete=models.DO_NOTHING, blank=True, null=True
    )

    class Meta:
        db_table = "job_posting_skill"


class JobPostingCandidate(SoftDeleteObject, models.Model):
    SOURCE_TYPE_CHOICES = (
        ("other", "other"),
        ("applied", "applied"),
        ("startdate", "startdate"),
    )

    id = models.UUIDField(
        primary_key=True,
        verbose_name="Job Posting Candidate ID",
        default=uuid.uuid4,
        editable=False,
    )
    job_posting_id = models.ForeignKey(
        "job_posting.JobPosting", on_delete=models.CASCADE, blank=True, null=True
    )
    candidate_id = models.ForeignKey(
        "candidate.Candidate", on_delete=models.CASCADE, blank=True, null=True
    )
    published = models.BooleanField(default=False)
    hiring_stage_id = models.ForeignKey(
        "company.KanbanBoard", on_delete=models.CASCADE, blank=True, null=True
    )
    source = models.CharField(choices=SOURCE_TYPE_CHOICES, max_length=255, blank=True, null=True, default='startdate')
    accuracy = models.FloatField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "job_posting_candidate"


class JobPostingCandidateSkill(SoftDeleteObject, models.Model):
    id = models.UUIDField(
        primary_key=True,
        verbose_name="Job Posting Candidate Skill ID",
        default=uuid.uuid4,
        editable=False,
    )
    job_posting_candidate_id = models.ForeignKey(
        "job_posting.JobPostingCandidate",
        on_delete=models.CASCADE,
        blank=True,
        null=True,
    )
    skill_name = models.CharField(max_length=255, blank=True, null=True)
    candidate_skill_id = models.ForeignKey(
        "candidate.CandidateSkill", on_delete=models.CASCADE, blank=True, null=True
    )
    accuracy = models.FloatField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "job_posting_candidate_skill"


class JobPostingReveals(SoftDeleteObject, models.Model):
    id = models.UUIDField(
        primary_key=True,
        verbose_name="Job Posting Reveal ID",
        default=uuid.uuid4,
        editable=False,
    )
    job_posting_id = models.ForeignKey(
        "job_posting.JobPosting", on_delete=models.CASCADE, blank=True, null=True
    )
    candidate_id = models.ForeignKey(
        "candidate.Candidate", on_delete=models.CASCADE, blank=True, null=True
    )
    subscription_id = models.ForeignKey(
        "company.Subscription", on_delete=models.DO_NOTHING, blank=True, null=True
    )
    revealed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="candidate_revealed_by",
        on_delete=models.DO_NOTHING,
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "job_posting_reveals"


class JobPostingTemplate(SoftDeleteObject, models.Model):
    id = models.UUIDField(
        primary_key=True,
        verbose_name="Job Posting Template ID",
        default=uuid.uuid4,
        editable=False,
    )
    title = models.CharField(max_length=255, blank=False, null=False)
    skill = models.TextField(blank=False, null=False)
    description = models.TextField(blank=False, null=False)
    industry_id = models.ForeignKey(
        "company.Industry", on_delete=models.DO_NOTHING, null=False, blank=False
    )
    company_id = models.ForeignKey(
        "company.Company", on_delete=models.CASCADE, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "job_posting_template"


class OtherCandidates(models.Model):
    id = models.UUIDField(
        primary_key=True,
        verbose_name="Other Candidates ID",
        default=uuid.uuid4,
        editable=False,
    )
    key = models.TextField(blank=False, null=False)
    error = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=255, blank=False, null=False, default="pending"
    )
    job_posting_id = models.ForeignKey(
        "job_posting.JobPosting", on_delete=models.DO_NOTHING, null=False, blank=False
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    inserted = models.BigIntegerField(null=True, blank=True)
    queued = models.BigIntegerField(null=True, blank=True)
    failed = models.BigIntegerField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="other_candidates_created_by",
        on_delete=models.DO_NOTHING,
        null=True,
        blank=True,
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="other_candidates_updated_by",
        null=True,
        blank=True,
        on_delete=models.DO_NOTHING,
    )

    class Meta:
        db_table = "other_candidates"


class JobPostingLabelWeight(models.Model):
    TARGET_LABELS_CHOICES = tuple((label, label) for label in [label['type'] for label in MLTrainingData.TARGET_LABELS])
    id = models.UUIDField(
        primary_key=True,
        verbose_name="Job Posting Label Weight ID",
        default=uuid.uuid4,
        editable=False,
    )
    type = models.CharField(
        choices=TARGET_LABELS_CHOICES, max_length=100, blank=False
    )
    job_posting_id = models.ForeignKey(
        "job_posting.JobPosting", on_delete=models.CASCADE, blank=True, null=True
    )
    weightage = models.IntegerField(default=0, validators=[MinValueValidator(0),
                                                           MaxValueValidator(100)], blank=False, null=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="job_posting_label_weight_created_by",
        on_delete=models.DO_NOTHING,
        null=True,
        blank=True,
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="job_posting_label_weight_updated_by",
        null=True,
        blank=True,
        on_delete=models.DO_NOTHING,
    )

    class Meta:
        unique_together = ['type', 'job_posting_id']
        db_table = "job_posting_label_weight"


@receiver(pre_save, sender=JobPostingLabelWeight)
def validate_weightage(sender, instance, **kwargs):
    weights = JobPostingLabelWeight.objects.filter(job_posting_id=instance.job_posting_id)

    if instance.weightage > 100:
        raise ValidationError(f"{instance.type} weightage cannot be greater than 100")
    elif instance.weightage < 0:
        raise ValidationError(f"{instance.type} weightage cannot be less than 0")
    
    if weights.exists():
        summary = [weight.weightage for weight in weights if weight.type == 'summary'][0]

        if instance.type != "summary" and summary + instance.weightage > 100:
            raise ValidationError(f"Total weightage of {instance.type} along with summary cannot be greater than 100")
    else:
        summary = [label['weightage'] for label in MLTrainingData.TARGET_LABELS if label['type'] == 'summary'][0]

        if instance.type != "summary" and summary + instance.weightage > 100:
            raise ValidationError(f"Total weightage of {instance.type} along with summary cannot be greater than 100")
        