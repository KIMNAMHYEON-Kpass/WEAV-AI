from django.urls import path
from . import views

urlpatterns = [
    path('complete/', views.complete_chat),
    path('image/', views.complete_image),
    path('job/<str:task_id>/', views.job_status),
]
