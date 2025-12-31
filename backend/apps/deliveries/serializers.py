"""
Delivery serializers
"""
from rest_framework import serializers
from .models import DeliveryOrder, Package, OrderStatusHistory
from apps.routes.serializers import RouteSerializer


class PackageSerializer(serializers.ModelSerializer):
    """Serializer for Package"""
    
    class Meta:
        model = Package
        fields = [
            'id', 'name', 'description', 'package_type',
            'weight', 'dimensions_length', 'dimensions_width', 'dimensions_height',
            'is_fragile', 'is_urgent', 'requires_temperature_control', 'temperature_range',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DeliveryOrderSerializer(serializers.ModelSerializer):
    """Serializer for DeliveryOrder"""
    
    package = PackageSerializer()
    customer_username = serializers.CharField(source='customer.username', read_only=True)
    drone_serial_number = serializers.CharField(source='drone.serial_number', read_only=True)
    pickup_lat = serializers.FloatField(required=False, write_only=True, allow_null=True)
    pickup_lng = serializers.FloatField(required=False, write_only=True, allow_null=True)
    delivery_lat = serializers.FloatField(required=False, write_only=True, allow_null=True)
    delivery_lng = serializers.FloatField(required=False, write_only=True, allow_null=True)
    pickup_location_data = serializers.JSONField(required=False, write_only=True, allow_null=True)
    delivery_location_data = serializers.JSONField(required=False, write_only=True, allow_null=True)

    route_summary = serializers.SerializerMethodField(read_only=True)
    route = serializers.SerializerMethodField(read_only=True)
    
    pickup_lat_read = serializers.SerializerMethodField()
    pickup_lng_read = serializers.SerializerMethodField()
    delivery_lat_read = serializers.SerializerMethodField()
    delivery_lng_read = serializers.SerializerMethodField()
    
    class Meta:
        model = DeliveryOrder
        fields = [
            'id', 'customer', 'customer_username',
            'pickup_address', 'pickup_location', 'pickup_lat', 'pickup_lng', 'pickup_lat_read', 'pickup_lng_read',
            'delivery_address', 'delivery_location', 'delivery_lat', 'delivery_lng', 'delivery_lat_read', 'delivery_lng_read',
            'package', 'drone', 'drone_serial_number',
            'status', 'requested_at', 'assigned_at', 'picked_up_at', 'delivered_at',
            'estimated_eta', 'estimated_duration_minutes', 'total_cost', 'actual_delivery_time', 'optimized_route',
            'priority', 'notes', 'pickup_location_data', 'delivery_location_data',
            'route_summary', 'route'
        ]
        read_only_fields = [
            'id', 'requested_at', 'assigned_at', 'picked_up_at',
            'delivered_at', 'actual_delivery_time', 'customer', 'optimized_route',
            'estimated_duration_minutes', 'total_cost', 'route_summary', 'route',
            'pickup_location', 'delivery_location', 'pickup_lat_read', 'pickup_lng_read',
            'delivery_lat_read', 'delivery_lng_read'
        ]
    
    def get_pickup_lat_read(self, obj):
        return obj.pickup_location.y if obj.pickup_location else None
    
    def get_pickup_lng_read(self, obj):
        return obj.pickup_location.x if obj.pickup_location else None
    
    def get_delivery_lat_read(self, obj):
        return obj.delivery_location.y if obj.delivery_location else None
    
    def get_delivery_lng_read(self, obj):
        return obj.delivery_location.x if obj.delivery_location else None

    def get_route_summary(self, obj):
        route = getattr(obj, 'optimized_route', None)
        if not route:
            return None
        waypoint_count = route.waypoints.count() if hasattr(route, 'waypoints') else None
        return {
            'route_id': route.id,
            'distance_km': float(route.total_distance) if route.total_distance is not None else None,
            'estimated_duration_minutes': route.estimated_duration,
            'estimated_eta': route.estimated_eta,
            'waypoint_count': waypoint_count,
        }

    def get_route(self, obj):
        route = getattr(obj, 'optimized_route', None)
        if not route:
            return None
        return RouteSerializer(route).data
    
    def create(self, validated_data):
        from django.contrib.gis.geos import Point
        
        package_data = validated_data.pop('package')
        package = Package.objects.create(**package_data)
        
        # Extract location data - handle both formats
        # Format 1: GeoJSON object (from frontend)
        pickup_location_data = validated_data.pop('pickup_location_data', None)
        delivery_location_data = validated_data.pop('delivery_location_data', None)
        
        # Format 2: lat/lng fields
        pickup_lat = validated_data.pop('pickup_lat', None)
        pickup_lng = validated_data.pop('pickup_lng', None)
        delivery_lat = validated_data.pop('delivery_lat', None)
        delivery_lng = validated_data.pop('delivery_lng', None)
        
        # Process pickup location
        if pickup_location_data and isinstance(pickup_location_data, dict):
            coords = pickup_location_data.get('coordinates', [])
            if len(coords) >= 2:
                validated_data['pickup_location'] = Point(float(coords[0]), float(coords[1]), srid=4326)
        elif pickup_lat is not None and pickup_lng is not None:
            validated_data['pickup_location'] = Point(float(pickup_lng), float(pickup_lat), srid=4326)
        
        # Process delivery location
        if delivery_location_data and isinstance(delivery_location_data, dict):
            coords = delivery_location_data.get('coordinates', [])
            if len(coords) >= 2:
                validated_data['delivery_location'] = Point(float(coords[0]), float(coords[1]), srid=4326)
        elif delivery_lat is not None and delivery_lng is not None:
            validated_data['delivery_location'] = Point(float(delivery_lng), float(delivery_lat), srid=4326)
        
        order = DeliveryOrder.objects.create(package=package, **validated_data)
        return order


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    """Serializer for OrderStatusHistory"""
    
    changed_by_username = serializers.CharField(source='changed_by.username', read_only=True)
    
    class Meta:
        model = OrderStatusHistory
        fields = ['id', 'order', 'status', 'changed_by', 'changed_by_username', 'notes', 'timestamp']
        read_only_fields = ['id', 'timestamp']

