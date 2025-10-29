from django.urls import path
from . import views

urlpatterns = [
    path('unsubscribe/<str:email>', views.AdwerkUnsubscribeMail.as_view()),
    path('adwerks_manual/<uuid:job_posting_id>', views.AdwerkManual.as_view()),
]
