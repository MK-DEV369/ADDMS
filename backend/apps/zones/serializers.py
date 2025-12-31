"""
Zone serializers with GeoJSON support
"""
from rest_framework import serializers
from .models import OperationalZone, NoFlyZone


class OperationalZoneSerializer(serializers.ModelSerializer):
    """Serializer for OperationalZone with GeoJSON"""
    
    boundary_geojson = serializers.SerializerMethodField()
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = OperationalZone
        fields = [
            'id', 'name', 'description', 'boundary', 'boundary_geojson',
            'altitude_min', 'altitude_max', 'is_active',
            'created_at', 'updated_at', 'created_by', 'created_by_username'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_boundary_geojson(self, obj):
        if obj.boundary:
            return obj.boundary.geojson
        return None


class NoFlyZoneSerializer(serializers.ModelSerializer):
    """Serializer for NoFlyZone with GeoJSON"""
    
    boundary_geojson = serializers.SerializerMethodField()
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = NoFlyZone
        fields = [
            'id', 'name', 'description', 'zone_type', 'boundary', 'boundary_geojson',
            'severity', 'altitude_min', 'altitude_max', 'is_active',
            'valid_from', 'valid_until',
            'created_at', 'updated_at', 'created_by', 'created_by_username'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_boundary_geojson(self, obj):
        if obj.boundary:
            return obj.boundary.geojson
        return None

