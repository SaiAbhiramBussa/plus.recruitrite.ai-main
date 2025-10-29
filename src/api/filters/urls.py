from django.urls import path
from .views import *

urlpatterns = [
    path('', Filters.as_view()),
    path('<uuid:filter_id>', FiltersById.as_view())
]
