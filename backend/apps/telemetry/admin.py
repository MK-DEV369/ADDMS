from django.contrib import admin
from django.contrib.gis.admin import OSMGeoAdmin
from .models import TelemetryData, DroneStatusStream


@admin.register(TelemetryData)
class TelemetryDataAdmin(OSMGeoAdmin):
    """Admin interface for TelemetryData"""
    list_display = ['drone', 'timestamp', 'altitude', 'speed', 'battery_level', 'is_in_flight']
    list_filter = ['timestamp', 'is_in_flight']
    search_fields = ['drone__serial_number']
    readonly_fields = ['timestamp']
    date_hierarchy = 'timestamp'


@admin.register(DroneStatusStream)
class DroneStatusStreamAdmin(admin.ModelAdmin):
    """Admin interface for DroneStatusStream"""
    list_display = ['drone', 'is_online', 'last_heartbeat', 'connection_quality']
    list_filter = ['is_online']
    search_fields = ['drone__serial_number']

