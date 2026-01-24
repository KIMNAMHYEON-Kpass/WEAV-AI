# WEAV AI AI 서비스 URL 라우팅

from django.urls import path
from . import views

app_name = 'ai'

urlpatterns = [
    path('complete/', views.complete_chat, name='complete_chat'),
]
