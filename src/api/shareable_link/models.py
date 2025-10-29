import uuid
from django.db import models
from softdelete.models import SoftDeleteObject
from startdate import settings


# Create your models here.


class ShareableLink(SoftDeleteObject, models.Model):
    id = models.UUIDField(primary_key=True, verbose_name='Shareable link', default=uuid.uuid4, editable=False)
    job_posting_id = models.ForeignKey("job_posting.JobPosting", on_delete=models.CASCADE, blank=True, null=True)
    token = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='shareable_link_created_by',
                                   on_delete=models.DO_NOTHING, null=True, blank=True)
    class Meta:
        db_table = "shareable_link"
        
class ShareableCandidates(SoftDeleteObject, models.Model):
    id = models.UUIDField(primary_key=True, verbose_name='Shareable link', default=uuid.uuid4, editable=False)
    job_posting_candidate_id = models.ForeignKey("job_posting.JobPostingCandidate",on_delete=models.CASCADE ,blank=True, null=True,)
    shareable_link_id = models.ForeignKey("shareable_link.ShareableLink",on_delete=models.CASCADE ,blank=True, null=True,)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "shareable_candidate_link"