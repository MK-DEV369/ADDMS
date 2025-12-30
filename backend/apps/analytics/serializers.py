"""
Analytics serializers
"""
from rest_framework import serializers
from .models import FleetAnalytics, SystemLog


class FleetAnalyticsSerializer(serializers.ModelSerializer):
    """Serializer for FleetAnalytics"""
    
    class Meta:
        model = FleetAnalytics
        fields = [
            'id', 'timestamp',
            'total_drones', 'active_drones', 'drones_in_flight', 'drones_in_maintenance',
            'total_orders', 'pending_orders', 'completed_orders', 'failed_orders',
            'avg_delivery_time_minutes', 'avg_eta_accuracy_percentage', 'total_distance_km',
            'avg_battery_level', 'low_battery_count',
            'fleet_uptime_percentage'
        ]
        read_only_fields = ['id', 'timestamp']


class SystemLogSerializer(serializers.ModelSerializer):
    """Serializer for SystemLog"""
    
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True, allow_null=True)
    
    class Meta:
        model = SystemLog
        fields = [
            'id', 'timestamp', 'level', 'level_display', 'service', 'message',
            'correlation_id', 'user', 'user_username', 'metadata'
        ]
        read_only_fields = ['id', 'timestamp']

