"""
Telemetry viewsets
"""
from rest_framework import viewsets, permissions
from django.utils import timezone
from datetime import timedelta
from .models import TelemetryData, DroneStatusStream
from .serializers import TelemetryDataSerializer, DroneStatusStreamSerializer


class TelemetryDataViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for TelemetryData (time-series)"""
    queryset = TelemetryData.objects.all()
    serializer_class = TelemetryDataSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['drone', 'is_in_flight']
    ordering_fields = ['timestamp']
    
    def get_queryset(self):
        """Filter by time range if provided"""
        queryset = super().get_queryset()
        
        # Default to last 24 hours
        hours = int(self.request.query_params.get('hours', 24))
        since = timezone.now() - timedelta(hours=hours)
        queryset = queryset.filter(timestamp__gte=since)
        
        return queryset.order_by('-timestamp')


class DroneStatusStreamViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for DroneStatusStream"""
    queryset = DroneStatusStream.objects.all()
    serializer_class = DroneStatusStreamSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['is_online', 'drone']

