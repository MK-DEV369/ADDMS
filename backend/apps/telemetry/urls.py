"""
Telemetry URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TelemetryDataViewSet, DroneStatusStreamViewSet

router = DefaultRouter()
router.register(r'data', TelemetryDataViewSet, basename='telemetry-data')
router.register(r'status', DroneStatusStreamViewSet, basename='drone-status-stream')

app_name = 'telemetry'

urlpatterns = [
    path('', include(router.urls)),
]

