from django.urls import path, include
from . import views
from accounts.urls import specific_company_urlpatterns as specific_account_urls
from location.urls import specific_company_urlpatterns as specific_location_urls
from payment_history.urls import specific_company_subscription_urlpatterns as specific_subscription_urls
from payment_history.urls import specific_company_billing_urlpatterns as specific_billing_urls

urlpatterns = [
    path('', views.CompanyBaseView.as_view()),
    path('<uuid:company_id>', views.SpecificCompanyView.as_view()),
    path('<uuid:company_id>/uploads', views.CompanyUploadsView.as_view()),
    path('import_stats', views.ImportStatsView.as_view()),
    path('<uuid:id>/job_posting', views.CompanyJobFetchingSerializer.as_view()),
    path('<uuid:id>/job_posting/<uuid:job_id>', views.CompanySpecificJobFetchingSerializer.as_view()),
    path('job_postings', views.CompanyAndJobsForCandidates.as_view()),
    path('industries', views.IndustriesList.as_view()),
    path('<uuid:company_id>/kanban-board', views.KanbanBoardConfig.as_view()),
    path('<uuid:id>/info', views.CompanyResourceInformation.as_view()),
    path('full-service', views.FullService.as_view()),
    path('<uuid:company_id>/locations/', include(specific_location_urls)),
    path('<uuid:company_id>/users/', include(specific_account_urls)),
    path('<uuid:company_id>/integrations/', include('integrations.urls')),
    path('<uuid:company_id>/subscriptions/', include(specific_subscription_urls)),
    path('<uuid:company_id>/billings/', include(specific_billing_urls)),
]

