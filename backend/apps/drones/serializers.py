"""
Drone serializers
"""
from rest_framework import serializers
from django.contrib.gis.geos import Point
from .models import Drone, MaintenanceLog


class DroneSerializer(serializers.ModelSerializer):
    """Serializer for Drone model"""
    
    current_position_lat = serializers.SerializerMethodField()
    current_position_lng = serializers.SerializerMethodField()
    
    class Meta:
        model = Drone
        fields = [
            'id', 'serial_number', 'model', 'manufacturer',
            'max_payload_weight', 'max_speed', 'max_altitude', 'max_range',
            'battery_capacity', 'status', 'battery_level',
            'current_position_lat', 'current_position_lng', 'current_altitude',
            'created_at', 'updated_at', 'last_heartbeat',
            'notes', 'is_active'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_current_position_lat(self, obj):
        if obj.current_position:
            return obj.current_position.y
        return None
    
    def get_current_position_lng(self, obj):
        if obj.current_position:
            return obj.current_position.x
        return None


class MaintenanceLogSerializer(serializers.ModelSerializer):
    """Serializer for MaintenanceLog"""
    
    drone_serial_number = serializers.CharField(source='drone.serial_number', read_only=True)
    performed_by_username = serializers.CharField(source='performed_by.username', read_only=True)
    
    class Meta:
        model = MaintenanceLog
        fields = [
            'id', 'drone', 'drone_serial_number',
            'maintenance_type', 'description',
            'performed_by', 'performed_by_username',
            'scheduled_at', 'completed_at', 'cost', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

