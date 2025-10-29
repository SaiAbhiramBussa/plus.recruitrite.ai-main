from django.urls import path
from .views import *  

urlpatterns = [
    path('', SubscriptionApiView.as_view()),
    path('stripe-webhook/', StripeEventsWebHook.as_view()),
    path('reveal_candidate/<uuid:id>', SubscriptionReveals.as_view()),
    path('full_service/<uuid:id>', FullServiceSubscription.as_view()),
    path('reveal_more_candidate/', SubscriptionReveals.as_view()),
    path("get_help_with_jobs", GetHelpWithJobsApiView.as_view()),
]

specific_company_subscription_urlpatterns = [
    path('', CompanySubscriptionApiView.as_view()),
]

specific_company_billing_urlpatterns = [
    path('', CompanyBillingApiView.as_view()),
]
