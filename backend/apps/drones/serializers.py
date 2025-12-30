"""
Drone serializers
"""
from rest_framework import serializers
from django.contrib.gis.geos import Point
from .models import Drone, MaintenanceLog


class DroneSerializer(serializers.ModelSerializer):
    """Serializer for Drone model"""
    
    current_position_lat = serializers.FloatField(required=False, write_only=False, allow_null=True)
    current_position_lng = serializers.FloatField(required=False, write_only=False, allow_null=True)
    home_base = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model = Drone
        fields = [
            'id', 'serial_number', 'model', 'manufacturer',
            'max_payload_weight', 'max_speed', 'max_altitude', 'max_range',
            'battery_capacity', 'status', 'battery_level',
            'current_position_lat', 'current_position_lng', 'current_altitude',
            'created_at', 'updated_at', 'last_heartbeat',
            'notes', 'is_active', 'home_base'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def to_representation(self, instance):
        """Convert DB representation to API output"""
        ret = super().to_representation(instance)
        if instance.current_position:
            ret['current_position_lat'] = instance.current_position.y
            ret['current_position_lng'] = instance.current_position.x
        else:
            ret['current_position_lat'] = None
            ret['current_position_lng'] = None
        
        # Extract home_base from notes
        if instance.notes:
            for line in instance.notes.split('\n'):
                if line.startswith('Home Base:'):
                    ret['home_base'] = line.replace('Home Base:', '').strip()
                    break
        
        return ret
    
    def create(self, validated_data):
        """Handle Point creation from lat/lng"""
        lat = validated_data.pop('current_position_lat', None)
        lng = validated_data.pop('current_position_lng', None)
        home_base = validated_data.pop('home_base', None)
        
        if lat is not None and lng is not None:
            validated_data['current_position'] = Point(lng, lat, srid=4326)
        
        # Store home_base in notes if provided
        if home_base:
            existing_notes = validated_data.get('notes', '')
            validated_data['notes'] = f"Home Base: {home_base}\n{existing_notes}".strip()
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Handle Point update from lat/lng"""
        lat = validated_data.pop('current_position_lat', None)
        lng = validated_data.pop('current_position_lng', None)
        home_base = validated_data.pop('home_base', None)
        
        if lat is not None and lng is not None:
            validated_data['current_position'] = Point(lng, lat, srid=4326)
        
        # Update home_base in notes if provided
        if home_base:
            existing_notes = validated_data.get('notes', instance.notes or '')
            # Replace existing home base info if present
            lines = existing_notes.split('\n')
            filtered_lines = [l for l in lines if not l.startswith('Home Base:')]
            validated_data['notes'] = f"Home Base: {home_base}\n" + '\n'.join(filtered_lines).strip()
        
        return super().update(instance, validated_data)


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

