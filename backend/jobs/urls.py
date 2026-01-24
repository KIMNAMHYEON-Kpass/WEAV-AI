# WEAV AI Jobs 앱 URL 설정 (임시: 아주 간단한 버전)

from django.urls import path
from . import views

# 앱 내 URL 패턴
app_name = 'jobs'

urlpatterns = [
    # 임시: 아주 간단한 Job 생성 API
    path('', views.create_job, name='create-job'),
]