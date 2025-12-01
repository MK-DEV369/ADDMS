"""
Delivery serializers
"""
from rest_framework import serializers
from .models import DeliveryOrder, Package, OrderStatusHistory


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
    pickup_lat = serializers.SerializerMethodField()
    pickup_lng = serializers.SerializerMethodField()
    delivery_lat = serializers.SerializerMethodField()
    delivery_lng = serializers.SerializerMethodField()
    
    class Meta:
        model = DeliveryOrder
        fields = [
            'id', 'customer', 'customer_username',
            'pickup_address', 'pickup_location', 'pickup_lat', 'pickup_lng',
            'delivery_address', 'delivery_location', 'delivery_lat', 'delivery_lng',
            'package', 'drone', 'drone_serial_number',
            'status', 'requested_at', 'assigned_at', 'picked_up_at', 'delivered_at',
            'estimated_eta', 'actual_delivery_time', 'optimized_route',
            'priority', 'notes'
        ]
        read_only_fields = [
            'id', 'requested_at', 'assigned_at', 'picked_up_at',
            'delivered_at', 'actual_delivery_time'
        ]
    
    def get_pickup_lat(self, obj):
        return obj.pickup_location.y if obj.pickup_location else None
    
    def get_pickup_lng(self, obj):
        return obj.pickup_location.x if obj.pickup_location else None
    
    def get_delivery_lat(self, obj):
        return obj.delivery_location.y if obj.delivery_location else None
    
    def get_delivery_lng(self, obj):
        return obj.delivery_location.x if obj.delivery_location else None
    
    def create(self, validated_data):
        package_data = validated_data.pop('package')
        package = Package.objects.create(**package_data)
        
        # Extract location data
        from django.contrib.gis.geos import Point
        pickup_lat = self.initial_data.get('pickup_lat')
        pickup_lng = self.initial_data.get('pickup_lng')
        delivery_lat = self.initial_data.get('delivery_lat')
        delivery_lng = self.initial_data.get('delivery_lng')
        
        if pickup_lat and pickup_lng:
            validated_data['pickup_location'] = Point(float(pickup_lng), float(pickup_lat), srid=4326)
        
        if delivery_lat and delivery_lng:
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

