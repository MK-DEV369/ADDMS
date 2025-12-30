"""
Analytics URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FleetAnalyticsViewSet, SystemLogViewSet

router = DefaultRouter()
router.register(r'fleet', FleetAnalyticsViewSet, basename='fleet-analytics')
router.register(r'logs', SystemLogViewSet, basename='system-logs')

app_name = 'analytics'

urlpatterns = [
    path('', include(router.urls)),
]

