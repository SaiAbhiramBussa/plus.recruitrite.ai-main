from django.urls import path
from .views import *

urlpatterns = [
    path('training/<uuid:job_posting_id>', ModelTrainingQueue.as_view()),
    path('webhook', ModelTrainingWebhhok.as_view()),
    path('', ModelTraining.as_view()),
]
