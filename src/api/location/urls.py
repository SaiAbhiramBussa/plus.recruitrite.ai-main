from django.urls import path, include
from . import views
from job_posting.urls import location_urlpatterns as job_posting_urls


urlpatterns = [
    path('<uuid:location_id>/jobs/', include(job_posting_urls)),
]

specific_company_urlpatterns = [
    path('', views.LocationsOfCompany.as_view()),
    path('<uuid:location_id>/', views.SpecificLocationOfCompany.as_view()),
]
