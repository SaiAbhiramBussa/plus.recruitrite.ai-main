from django.urls import path
from . import views

urlpatterns = [
    path("offers", views.JobPostingSerializerView.as_view()),
    path("applied/<uuid:candidate_id>", views.CandidateAppliedJobsView.as_view()),
    path("<uuid:id>", views.JobDataFetchingSerializer.as_view()),
    path("<uuid:job_posting_id>/update", views.JobPostingSerializerView.as_view()),
    path("<uuid:job_posting_id>/delete", views.JobPostingSerializerView.as_view()),
    path("multiple-import", views.JobPostingMultipleImportView.as_view()),
    path(
        "<uuid:job_posting_id>/kanban-board-candidate",
        views.KanbanBoardCandidate.as_view(),
    ),
    path("", views.AllJobPostingView.as_view()),
    path("jobposting_templates", views.JobPostingTemplateView.as_view()),
    path("industries", views.IndustryView.as_view()),
    path("open_industries", views.OpenIndustryView.as_view()),
    path("open_jobposting_templates", views.OpenJobPostingTemplateView.as_view()),
    path("import_jobs", views.ExternalJobPostingView.as_view()),
    path("<uuid:job_posting_id>/other_candidates", views.OtherCandidateImportView.as_view()),
    path("<uuid:job_posting_id>/apply/<uuid:candidate_id>", views.ApplyJobPostingView.as_view()),
    path("candidate_stats", views.OtherCandidatesImportStatsView.as_view()),
    path("<uuid:job_posting_id>/label_weightages", views.TargetLabelWeightages.as_view()),
    path("<uuid:job_posting_id>/label_weightages/defaults", views.TargetLabelWeightagesDefaults.as_view())
]

location_urlpatterns = [
    path("", views.LocationJobPostingBaseView.as_view()),
]
