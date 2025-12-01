from django.contrib import admin
from .models import FleetAnalytics


@admin.register(FleetAnalytics)
class FleetAnalyticsAdmin(admin.ModelAdmin):
    """Admin interface for FleetAnalytics"""
    list_display = [
        'timestamp', 'total_drones', 'active_drones',
        'drones_in_flight', 'total_orders', 'completed_orders'
    ]
    list_filter = ['timestamp']
    readonly_fields = ['timestamp']
    date_hierarchy = 'timestamp'

