from django.urls import path
from . import views, training_candidates

urlpatterns = [
    path('prescreen_candidates/<uuid:id>', views.PrescreenedCandidatesDisplay.as_view()),
    path('training_candidates', views.TrainingPrescreenData.as_view()),
    path('training_candidates/<uuid:id>', views.TrainingPrescreenData.as_view()),
    path('training_candidates/<uuid:id>/update', views.TrainingPrescreenData.as_view()),
    path('training_candidates/download-csv', training_candidates.DownloadMultipleTrainingCandidatesV2.as_view()),
    path('training_candidates/<uuid:id>/download-csv', training_candidates.DownloadTrainingCandidatesV2.as_view()),
    path('training_candidates/<uuid:id>/download-zip', views.DownloadTrainingCandidates.as_view()),
    path('prescreen_candidates/<uuid:id>/download-csv', training_candidates.DownloadPrescreenCandidatesV2.as_view()),
    path('prescreen_candidates/<uuid:id>/download-zip', views.DownloadPrescreenCandidates.as_view()),
    path('ml_output_candidates/<uuid:id>', views.MLOutputData.as_view()),
    path('ml_output_candidates', views.MLOutputData.as_view()),
    path('candidates/published', views.PublishCandidates.as_view()),
    path('alerts/see_all_profiles', views.AdminSeeAllProfilesAlert.as_view()),
    path('refresh/<uuid:id>', views.ModelRefresh.as_view()),
    path('candidate_ml_push', views.ModelPush.as_view()),
    path('candidate_openai_push' , views.OpenaiPush.as_view()),
    path('ml_output/<uuid:id>',views.MlOutputAlert.as_view())
]
