"""
Notification serializers
"""
from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification"""
    
    class Meta:
        model = Notification
        fields = [
            'id', 'user', 'notification_type', 'title', 'message',
            'is_read', 'related_object_id', 'related_object_type',
            'created_at', 'read_at'
        ]
        read_only_fields = ['id', 'created_at']

