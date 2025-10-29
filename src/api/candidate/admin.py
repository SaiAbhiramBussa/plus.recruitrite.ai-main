from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Candidate, CandidateAttributes, CandidateWorkHistory, CandidateEducationHistory, CandidateSkill
from django.apps import apps


class CandidateAdminConfig(admin.ModelAdmin):
    ordering = ('created_at', 'updated_at')
    search_fields = ('email', 'first_name', 'last_name', 'phone')
    list_filter = ('first_name', 'last_name', 'created_at', 'updated_at')
    list_display = ('id', 'first_name', 'middle_name', 'last_name', 'gender', 'email', 'status', 'user_id')


admin.site.register(Candidate, CandidateAdminConfig)


class CandidateAttributesAdminConfig(admin.ModelAdmin):
    ordering = ('address', 'city', 'country', 'state', 'zip')
    search_fields = ('address', 'city', 'country', 'state', 'zip')
    list_filter = ('address', 'city', 'country', 'state', 'zip')
    list_display = ('id', 'address', 'city', 'country', 'state', 'zip', 'candidate_id')


admin.site.register(CandidateAttributes, CandidateAttributesAdminConfig)


class CandidateWorkHistoryAdminConfig(admin.ModelAdmin):
    ordering = ('created_at', 'updated_at')
    search_fields = ('title', 'description', 'from_date', 'to_date')
    list_filter = ('title', 'description', 'from_date', 'to_date')
    list_display = ('id', 'company_id', 'location_id', 'candidate_id', 'title', 'description', 'from_date', 'to_date',
                    'created_at', 'updated_at')


admin.site.register(CandidateWorkHistory, CandidateWorkHistoryAdminConfig)


class CandidateEducationHistoryAdminConfig(admin.ModelAdmin):
    ordering = ('created_at', 'updated_at')
    search_fields = ('name', 'degree', 'field', 'from_date', 'to_date')
    list_filter = ('name', 'degree', 'field', 'from_date', 'to_date')
    list_display = ('id', 'name', 'degree', 'field', 'from_date', 'to_date',
                    'created_at', 'updated_at')


admin.site.register(CandidateEducationHistory, CandidateEducationHistoryAdminConfig)

class CandidateSkillAdminConfig(admin.ModelAdmin):
    search_fields = ('skill_id',)
admin.site.register(CandidateSkill, CandidateSkillAdminConfig)
