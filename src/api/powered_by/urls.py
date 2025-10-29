from django.urls import path
from .views import *

urlpatterns = [
    path('screen', PoweredByRequestView.as_view()),
    path('webhook', PoweredByWebhookView.as_view()),
    path('screen/<uuid:request_id>', PoweredBySpecificRequestView.as_view()),
    path('resume/<uuid:attachment_id>', PoweredBySpecificResumeDownload.as_view()),
    path('screen/download/<uuid:request_id>', PoweredBySpecificRequestDownload.as_view()),
    path('screen_logs', PoweredByRequestLogsView.as_view()),
]
