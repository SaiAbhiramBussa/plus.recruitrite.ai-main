from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Company, Location, Industry, Subscription
from django.apps import apps


class CompanyAdminConfig(admin.ModelAdmin):
    ordering = ('created_at', 'updated_at')
    search_fields = ('name', 'type', 'logo', 'description')
    list_filter = ('name', 'type', 'logo', 'description')
    list_display = ('id', 'name', 'type', 'logo', 'description', 'created_at', 'updated_at')


admin.site.register(Company, CompanyAdminConfig)


class LocationAdminConfig(admin.ModelAdmin):
    ordering = ('created_at', 'updated_at')
    search_fields = ('address', 'city', 'country', 'state', 'zip')
    list_filter = ('address', 'city', 'country', 'state', 'zip')
    list_display = ('id', 'address', 'city', 'country', 'state', 'zip', 'company_id', 'created_at', 'updated_at')


admin.site.register(Location, LocationAdminConfig)


class IndustryAdminConfig(admin.ModelAdmin):
    ordering = ('created_at', 'updated_at')
    search_fields = ('id', 'title')
    list_filter = ('id', 'title', 'created_at', 'updated_at')
    list_display = ('id',  'title', 'created_at', 'updated_at')


admin.site.register(Industry, IndustryAdminConfig)


class SubscriptionAdminConfig(admin.ModelAdmin):
    ordering = ('created_at', 'updated_at')
    search_fields = ('type','company_id')


admin.site.register(Subscription, SubscriptionAdminConfig)