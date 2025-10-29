from django.urls import path, include
from . import views

urlpatterns = [
    path('', views.ConversationThreadView.as_view()),
    path('create/<uuid:job_posting_id>', views.ConversationThreadView.as_view()),
    path('<uuid:thread_id>', views.ThreadMessageView.as_view()),
    path('<uuid:thread_id>/messages/<uuid:message_id>', views.MessageBaseView.as_view()),
]
