"""
Drone URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DroneViewSet, MaintenanceLogViewSet

router = DefaultRouter()
router.register(r'drones', DroneViewSet, basename='drone')
router.register(r'maintenance', MaintenanceLogViewSet, basename='maintenance-log')

app_name = 'drones'

urlpatterns = [
    path('', include(router.urls)),
]

