"""
Route serializers with GeoJSON
"""
from rest_framework import serializers
from .models import Route, Waypoint


class WaypointSerializer(serializers.ModelSerializer):
    """Serializer for Waypoint"""
    
    lat = serializers.SerializerMethodField()
    lng = serializers.SerializerMethodField()
    
    class Meta:
        model = Waypoint
        fields = [
            'id', 'route', 'sequence', 'position', 'lat', 'lng',
            'altitude', 'action', 'estimated_arrival'
        ]
        read_only_fields = ['id']
    
    def get_lat(self, obj):
        return obj.position.y if obj.position else None
    
    def get_lng(self, obj):
        return obj.position.x if obj.position else None


class RouteSerializer(serializers.ModelSerializer):
    """Serializer for Route"""
    
    path_geojson = serializers.SerializerMethodField()
    waypoints = WaypointSerializer(many=True, read_only=True)
    delivery_order_id = serializers.IntegerField(source='delivery_order.id', read_only=True)
    
    class Meta:
        model = Route
        fields = [
            'id', 'delivery_order', 'delivery_order_id',
            'path', 'path_geojson', 'waypoints',
            'total_distance', 'estimated_duration', 'estimated_eta',
            'confidence_score', 'optimization_method',
            'avoids_no_fly_zones', 'avoids_weather_hazards', 'altitude_profile',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_path_geojson(self, obj):
        if obj.path:
            return obj.path.geojson
        return None

