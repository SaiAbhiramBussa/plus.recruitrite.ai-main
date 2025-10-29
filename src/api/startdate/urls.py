"""startdate URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('accounts.urls')),
    path('api/accounts/', include('accounts.urls')),
    path('api/candidates/', include('candidate.urls')),
    path('api/jobs/', include('job_posting.urls')),
    path('api/companies/', include('company.urls')),
    path('api/machine_learning/', include('machine_learning.urls')),
    path('api/adwerks/', include('adwerks.urls')),
    path('api/subscriptions/', include('payment_history.urls')),
    path('api/locations/', include('location.urls')),
    path('api/v1/powered_by/', include('powered_by.urls')),
    path('api/v1/playground/', include('playground.urls')),
    path('api/model_training/', include('model_training.urls')),
    path('api/shareable/candidates/', include('shareable_link.urls')),
    path('api/chats/', include('conversation_thread.urls')),
    path('api/job_titles/', include('title_mapping.urls')),
]
