"""
Zone URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OperationalZoneViewSet, NoFlyZoneViewSet

router = DefaultRouter()
router.register(r'operational', OperationalZoneViewSet, basename='operational-zone')
router.register(r'no-fly', NoFlyZoneViewSet, basename='no-fly-zone')

app_name = 'zones'

urlpatterns = [
    path('', include(router.urls)),
]

