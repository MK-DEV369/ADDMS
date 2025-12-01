from django.contrib import admin
from django.contrib.gis.admin import OSMGeoAdmin
from .models import Drone, MaintenanceLog


@admin.register(Drone)
class DroneAdmin(OSMGeoAdmin):
    """Admin interface for Drone model"""
    list_display = ['serial_number', 'model', 'status', 'battery_level', 'is_active', 'last_heartbeat']
    list_filter = ['status', 'model', 'manufacturer', 'is_active']
    search_fields = ['serial_number', 'model', 'manufacturer']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(MaintenanceLog)
class MaintenanceLogAdmin(admin.ModelAdmin):
    """Admin interface for MaintenanceLog"""
    list_display = ['drone', 'maintenance_type', 'scheduled_at', 'completed_at', 'performed_by']
    list_filter = ['maintenance_type', 'scheduled_at']
    search_fields = ['drone__serial_number', 'description']

