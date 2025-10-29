from django.urls import path
from .views import *

urlpatterns = [
    path('screening', PlaygroundBaseView.as_view()),
    path('screening/<uuid:powered_by_request_id>', SpecificPlaygroundBaseView.as_view()),
]
