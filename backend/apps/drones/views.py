"""
Drone viewsets and views
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
import structlog

from .models import Drone, MaintenanceLog
from .serializers import DroneSerializer, MaintenanceLogSerializer
from apps.users.permissions import IsAdminOrManager, IsAdmin

logger = structlog.get_logger(__name__)


class DroneViewSet(viewsets.ModelViewSet):
    """ViewSet for Drone CRUD operations"""
    queryset = Drone.objects.all()
    serializer_class = DroneSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status', 'model', 'manufacturer', 'is_active']
    search_fields = ['serial_number', 'model', 'manufacturer']
    ordering_fields = ['created_at', 'battery_level', 'serial_number']
    
    def get_queryset(self):
        """Filter queryset based on user role"""
        user = self.request.user
        logger.debug("Fetching drones", namespace="drones", user_id=user.id, role=user.role)
        return Drone.objects.all()
    
    @action(detail=True, methods=['post'])
    def update_position(self, request, pk=None):
        """Update drone position (used by telemetry system)"""
        drone = self.get_object()
        lat = request.data.get('latitude')
        lng = request.data.get('longitude')
        altitude = request.data.get('altitude', 0)
        
        if lat is None or lng is None:
            return Response(
                {"error": "latitude and longitude are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from django.contrib.gis.geos import Point
        drone.current_position = Point(float(lng), float(lat), srid=4326)
        drone.current_altitude = altitude
        drone.save()
        
        logger.info(
            "Drone position updated",
            namespace="drones",
            drone_id=drone.id,
            lat=lat,
            lng=lng,
            altitude=altitude
        )
        
        return Response(DroneSerializer(drone).data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrManager])
    def update_status(self, request, pk=None):
        """Update drone status (admin/manager only)"""
        drone = self.get_object()
        new_status = request.data.get('status')
        
        if not new_status or new_status not in dict(Drone.Status.choices):
            return Response(
                {"error": f"Invalid status. Must be one of: {', '.join([s[0] for s in Drone.Status.choices])}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_status = drone.status
        drone.status = new_status
        drone.save()
        
        logger.info(
            "Drone status updated",
            namespace="drones",
            drone_id=drone.id,
            old_status=old_status,
            new_status=new_status,
            user_id=request.user.id
        )
        
        return Response(DroneSerializer(drone).data)
    
    @action(detail=True, methods=['post'])
    def update_battery(self, request, pk=None):
        """Update drone battery level"""
        drone = self.get_object()
        battery_level = request.data.get('battery_level')
        
        if battery_level is None or not (0 <= int(battery_level) <= 100):
            return Response(
                {"error": "battery_level must be between 0 and 100"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        drone.battery_level = int(battery_level)
        drone.save()
        
        logger.info(
            "Drone battery updated",
            namespace="drones",
            drone_id=drone.id,
            battery_level=battery_level
        )
        
        return Response(DroneSerializer(drone).data)
    
    @action(detail=False, methods=['get'])
    def available(self, request):
        """Get available drones (idle, charged, not in maintenance)"""
        available_drones = Drone.objects.filter(
            status__in=[Drone.Status.IDLE],
            battery_level__gte=20,
            is_active=True
        )
        serializer = self.get_serializer(available_drones, many=True)
        logger.debug("Available drones fetched", namespace="drones", count=available_drones.count())
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get fleet statistics (admin/manager only)"""
        if not (request.user.is_admin() or request.user.is_manager()):
            return Response(
                {"error": "Permission denied"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        stats = {
            'total': Drone.objects.count(),
            'active': Drone.objects.filter(is_active=True).count(),
            'idle': Drone.objects.filter(status=Drone.Status.IDLE).count(),
            'in_flight': Drone.objects.filter(status=Drone.Status.IN_FLIGHT).count(),
            'maintenance': Drone.objects.filter(status=Drone.Status.MAINTENANCE).count(),
            'low_battery': Drone.objects.filter(battery_level__lt=20).count(),
        }
        
        logger.info("Fleet stats fetched", namespace="drones", stats=stats)
        return Response(stats)


class MaintenanceLogViewSet(viewsets.ModelViewSet):
    """ViewSet for MaintenanceLog"""
    queryset = MaintenanceLog.objects.all()
    serializer_class = MaintenanceLogSerializer
    permission_classes = [IsAdminOrManager]
    filterset_fields = ['drone', 'maintenance_type']
    ordering_fields = ['scheduled_at', 'created_at']
    
    def perform_create(self, serializer):
        serializer.save(performed_by=self.request.user)
        logger.info(
            "Maintenance log created",
            namespace="drones",
            user_id=self.request.user.id
        )

