from django.contrib import admin
from django.contrib.gis.admin import OSMGeoAdmin
from .models import Route, Waypoint


@admin.register(Route)
class RouteAdmin(OSMGeoAdmin):
    """Admin interface for Route"""
    list_display = ['id', 'delivery_order', 'total_distance', 'estimated_duration', 'estimated_eta', 'confidence_score']
    list_filter = ['optimization_method', 'created_at']
    search_fields = ['delivery_order__id']


@admin.register(Waypoint)
class WaypointAdmin(OSMGeoAdmin):
    """Admin interface for Waypoint"""
    list_display = ['id', 'route', 'sequence', 'altitude', 'action']
    list_filter = ['action', 'route']
    ordering = ['route', 'sequence']

