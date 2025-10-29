from django.urls import path, include
from . import views

urlpatterns = [
    path('', views.IntegrationListView.as_view()),
    path('<uuid:id>', views.IntegrationDetailView.as_view()),
    path('<uuid:id>/credentials', views.CredentialsDetailView.as_view()),
]
