from django.urls import path
from . import views

urlpatterns = [
    # path('login', views.LoginSerializerView.as_view()),
    # path('register', views.RegisterSerializerView.as_view()),
    path('register/otp', views.RegisterOtpSerializerView.as_view()),
    path('logout', views.LogoutView.as_view()),
    path('send/otp', views.LoginSendOtp.as_view()),
    path('verify/otp', views.LoginRecieveOtp.as_view()),
    path('update', views.MobileDeviceToken.as_view()),
    path('notification_settings', views.NotificationSettingsView.as_view()),
    path('notifications', views.NotificationsView.as_view()),
    path('<uuid:user_id>/refresh', views.RefreshTokenView.as_view()),
    path('fetch_employees', views.CompanyEmployees.as_view()),
    path('share_credits', views.ShareCredits.as_view()),
    path('contact', views.ContactUsView.as_view()),
    path('allocate_credits', views.AllocateUsersCredits.as_view()),
    path("user_language", views.SetUserLanguage.as_view()),
]

specific_company_urlpatterns = [
    path('', views.UserBaseView.as_view()),
    path('<uuid:user_id>/', views.SpecificUserView.as_view()),
]
