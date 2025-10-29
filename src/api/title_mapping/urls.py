from django.urls import path
from . import views

urlpatterns = [
    path("", views.JobTitlesView.as_view()),
    path("<uuid:job_title_id>", views.JobTitlesSpecificView.as_view()),
    path("<uuid:job_title_id>/mappings", views.JobMappingsView.as_view()),
]

