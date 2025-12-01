from django.contrib import admin
from django.contrib.gis.admin import OSMGeoAdmin
from .models import OperationalZone, NoFlyZone


@admin.register(OperationalZone)
class OperationalZoneAdmin(OSMGeoAdmin):
    """Admin interface for OperationalZone"""
    list_display = ['name', 'is_active', 'altitude_min', 'altitude_max', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']


@admin.register(NoFlyZone)
class NoFlyZoneAdmin(OSMGeoAdmin):
    """Admin interface for NoFlyZone"""
    list_display = ['name', 'zone_type', 'is_active', 'valid_from', 'valid_until']
    list_filter = ['zone_type', 'is_active', 'valid_from', 'valid_until']
    search_fields = ['name', 'description']

