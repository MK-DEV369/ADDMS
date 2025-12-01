"""
Analytics URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FleetAnalyticsViewSet

router = DefaultRouter()
router.register(r'fleet', FleetAnalyticsViewSet, basename='fleet-analytics')

app_name = 'analytics'

urlpatterns = [
    path('', include(router.urls)),
]

