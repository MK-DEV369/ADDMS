"""
Telemetry viewsets
"""
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import TelemetryData, DroneStatusStream
from .serializers import TelemetryDataSerializer, DroneStatusStreamSerializer
from .tasks import process_live_telemetry
from apps.analytics.models import SystemLog


class TelemetryDataViewSet(viewsets.ModelViewSet):
    """ViewSet for TelemetryData (time-series); allows ingest via POST"""
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

    def create(self, request, *args, **kwargs):
        """Ingest live telemetry and fan it out via Celery/WebSocket"""
        payload = request.data or {}
        drone_id = payload.get('drone') or payload.get('drone_id')
        serial = payload.get('drone_serial_number') or payload.get('serial_number')

        try:
            from apps.drones.models import Drone

            if drone_id:
                drone = Drone.objects.get(id=drone_id)
            elif serial:
                drone = Drone.objects.get(serial_number=serial)
            else:
                return Response(
                    {'error': 'drone or serial_number is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Drone.DoesNotExist:
            return Response({'error': 'Drone not found'}, status=status.HTTP_404_NOT_FOUND)

        telemetry_payload = {
            'latitude': payload.get('latitude') or payload.get('lat'),
            'longitude': payload.get('longitude') or payload.get('lng'),
            'altitude': payload.get('altitude'),
            'heading': payload.get('heading'),
            'speed': payload.get('speed'),
            'battery_level': payload.get('battery_level'),
            'battery_voltage': payload.get('battery_voltage'),
            'temperature': payload.get('temperature'),
            'wind_speed': payload.get('wind_speed'),
            'wind_direction': payload.get('wind_direction'),
            'is_in_flight': payload.get('is_in_flight', True),
            'gps_signal_strength': payload.get('gps_signal_strength'),
            'connection_quality': payload.get('connection_quality'),
            'mission_id': payload.get('mission_id'),
        }

        try:
            process_live_telemetry.delay(drone.id, telemetry_payload)
            queued = True
        except Exception:
            # Fallback to inline processing if Celery broker is unavailable
            process_live_telemetry(drone.id, telemetry_payload)
            queued = False

        SystemLog.log(
            level=SystemLog.LogLevel.INFO,
            service='telemetry',
            message=f"Telemetry ingested for drone {drone.serial_number}",
            metadata={
                'drone_id': drone.id,
                'queued': queued,
                'source': 'api',
            }
        )

        return Response(
            {
                'status': 'accepted',
                'drone_id': drone.id,
                'serial_number': drone.serial_number,
                'queued': queued
            },
            status=status.HTTP_202_ACCEPTED
        )


class DroneStatusStreamViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for DroneStatusStream"""
    queryset = DroneStatusStream.objects.all()
    serializer_class = DroneStatusStreamSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['is_online', 'drone']

