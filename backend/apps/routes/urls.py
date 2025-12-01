"""
Route URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RouteViewSet, WaypointViewSet

router = DefaultRouter()
router.register(r'routes', RouteViewSet, basename='route')
router.register(r'waypoints', WaypointViewSet, basename='waypoint')

app_name = 'routes'

urlpatterns = [
    path('', include(router.urls)),
]

