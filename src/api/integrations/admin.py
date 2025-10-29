from django.contrib import admin

# Register your models here.
from .models import IntegrationKey


class IntegrationKeyAdminConfig(admin.ModelAdmin):
    ordering = ('key', 'created_at', 'updated_at')
    search_fields = ('key', 'type', 'company_id', 'credentials')
    list_filter = ('key', 'type', 'company_id', 'credentials')
    list_display = ('id', 'key', 'type', 'company_id', 'credentials', 'created_at', 'updated_at')


admin.site.register(IntegrationKey, IntegrationKeyAdminConfig)

