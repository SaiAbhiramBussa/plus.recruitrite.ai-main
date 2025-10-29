from django.urls import path, include
from filters.urls import urlpatterns as candidate_filters
from . import views

urlpatterns = [
    path('view', views.AdminCandidatesView.as_view()),
    path('import', views.UploadFileView.as_view()),
    path('recommended/<uuid:job_posting_id>', views.FetchRecommendedCandidates.as_view()),
    path('recommended/<uuid:job_posting_id>/download', views.DownloadUnmaskedRecommendedCandidates.as_view()),
    path('recommended/<uuid:job_posting_id>/candidate/<uuid:candidate_id>', views.FetchSpecificRecommendedCandidate.as_view()),
    path('apollo-jobs', views.ApolloJobsBackgroundTaskCrudApi.as_view()),
    path('apollo-jobs/<uuid:id>/update', views.ApolloJobsBackgroundTaskCrudApi.as_view()),
    path('apollo-jobs/<uuid:id>/delete', views.ApolloJobsBackgroundTaskCrudApi.as_view()),
    path('apollo-jobs/detail', views.ApolloJobsBackgroundTaskCrudApi.as_view()),
    path('apollo-jobs/<uuid:id>', views.ApolloJobsBackgroundTaskGetById.as_view()),
    path('apollo-jobs/total-count', views.ApolloBackgroundJobTotalCountCheck.as_view()),
    path('apollo-jobs/label-list', views.ApolloLabelList.as_view()),
    path('candidate-profile', views.CandidateProfileView.as_view()),
    path('<uuid:candidate_id>/uploads', views.CandidateResourceUploadsView.as_view()),
    path('candidate-follow', views.CandidateFollowView.as_view()),
    path('chrome-extension', views.CandidateChromeExtensionImport.as_view()),
    path('parse-resume', views.CandidateResumeView.as_view()),
    path('', views.CandidateView.as_view()),
    path('<uuid:id>', views.CandidateView.as_view()),
    path('<uuid:candidate_id>/mask_settings', views.CandidateMaskSettingsView.as_view()),
    path('<uuid:candidate_id>/filters/', include(candidate_filters)),
    path('<uuid:candidate_id>/reveal/<uuid:job_posting_id>', views.CandidateRevealView.as_view()),
    path('fetch_candidates', views.FetchCandidatesView.as_view()),
]
