from django.urls import path
from . import views

urlpatterns = [
    path('', views.ShareableLinkView.as_view()),
    path('request_interview', views.RequestInterview.as_view())
]
