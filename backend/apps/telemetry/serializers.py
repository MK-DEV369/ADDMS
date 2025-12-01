"""
Telemetry serializers
"""
from rest_framework import serializers
from .models import TelemetryData, DroneStatusStream


class TelemetryDataSerializer(serializers.ModelSerializer):
    """Serializer for TelemetryData"""
    
    drone_serial_number = serializers.CharField(source='drone.serial_number', read_only=True)
    lat = serializers.SerializerMethodField()
    lng = serializers.SerializerMethodField()
    
    class Meta:
        model = TelemetryData
        fields = [
            'id', 'drone', 'drone_serial_number', 'timestamp',
            'position', 'lat', 'lng', 'altitude', 'heading',
            'speed', 'battery_level', 'battery_voltage',
            'temperature', 'wind_speed', 'wind_direction',
            'is_in_flight', 'gps_signal_strength'
        ]
        read_only_fields = ['id', 'timestamp']
    
    def get_lat(self, obj):
        return obj.position.y if obj.position else None
    
    def get_lng(self, obj):
        return obj.position.x if obj.position else None


class DroneStatusStreamSerializer(serializers.ModelSerializer):
    """Serializer for DroneStatusStream"""
    
    drone_serial_number = serializers.CharField(source='drone.serial_number', read_only=True)
    
    class Meta:
        model = DroneStatusStream
        fields = [
            'id', 'drone', 'drone_serial_number',
            'is_online', 'last_heartbeat', 'connection_quality',
            'current_mission', 'updated_at'
        ]
        read_only_fields = ['id', 'updated_at']

