from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import JobPosting, Skill, JobPostingCandidate
from django.apps import apps


class JobPostingAdminConfig(admin.ModelAdmin):
    ordering = ('created_at', 'updated_at')
    search_fields = ('id', 'title', 'compensation', 'description', 'status')
    list_filter = ('id', 'title', 'compensation', 'description', 'status')
    list_display = ('id', 'title', 'compensation', 'description', 'status', 'location_id',
                    'created_at', 'updated_at')


admin.site.register(JobPosting, JobPostingAdminConfig)


class SkillAdminConfig(admin.ModelAdmin):
    ordering = ('created_at', 'updated_at')
    search_fields = ('id', 'name')
    list_filter = ('id', 'name', 'created_at', 'updated_at')
    list_display = ('id', 'name', 'created_at', 'updated_at')


admin.site.register(Skill, SkillAdminConfig)


class JobPostingCandidateAdminConfig(admin.ModelAdmin):
    ordering = ('created_at', 'updated_at')
    search_fields = ('id','candidate_id', 'job_posting_id')
    list_filter = ('id', 'candidate_id', 'job_posting_id', 'created_at', 'updated_at')
    list_display = ('id', 'created_at', 'updated_at')


admin.site.register(JobPostingCandidate, JobPostingCandidateAdminConfig)
