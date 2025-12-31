"""
Zone viewsets with spatial queries
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.gis.geos import Point
import structlog

from .models import OperationalZone, NoFlyZone
from .serializers import OperationalZoneSerializer, NoFlyZoneSerializer
from apps.users.permissions import IsAdminOrManager

logger = structlog.get_logger(__name__)


class OperationalZoneViewSet(viewsets.ModelViewSet):
    """ViewSet for OperationalZone"""
    queryset = OperationalZone.objects.all()
    serializer_class = OperationalZoneSerializer
    permission_classes = [IsAdminOrManager]
    filterset_fields = ['is_active']
    search_fields = ['name', 'description']
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
        logger.info(
            "Operational zone created",
            namespace="zones",
            user_id=self.request.user.id
        )
    
    @action(detail=False, methods=['post'])
    def check_point(self, request):
        """Check if a point is within an operational zone"""
        lat = request.data.get('latitude')
        lng = request.data.get('longitude')
        
        if lat is None or lng is None:
            return Response(
                {"error": "latitude and longitude are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        point = Point(float(lng), float(lat), srid=4326)
        zones = OperationalZone.objects.filter(
            boundary__contains=point,
            is_active=True
        )
        
        serializer = self.get_serializer(zones, many=True)
        return Response({
            'point': {'latitude': lat, 'longitude': lng},
            'zones': serializer.data,
            'is_operational': zones.exists()
        })


class NoFlyZoneViewSet(viewsets.ModelViewSet):
    """ViewSet for NoFlyZone"""
    queryset = NoFlyZone.objects.all()
    serializer_class = NoFlyZoneSerializer
    permission_classes = [IsAdminOrManager]
    filterset_fields = ['is_active', 'zone_type', 'severity']
    search_fields = ['name', 'description']
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
        logger.info(
            "No-fly zone created",
            namespace="zones",
            user_id=self.request.user.id
        )
    
    @action(detail=False, methods=['post'])
    def check_point(self, request):
        """Check if a point intersects with any no-fly zones"""
        lat = request.data.get('latitude')
        lng = request.data.get('longitude')
        altitude = request.data.get('altitude')
        
        if lat is None or lng is None:
            return Response(
                {"error": "latitude and longitude are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        point = Point(float(lng), float(lat), srid=4326)
        is_restricted = NoFlyZone.check_point_intersection(point, altitude=altitude)
        
        if is_restricted:
            zones = NoFlyZone.objects.filter(
                boundary__intersects=point,
                is_active=True
            )
            serializer = self.get_serializer(zones, many=True)
            return Response({
                'point': {'latitude': lat, 'longitude': lng, 'altitude': altitude},
                'zones': serializer.data,
                'is_restricted': True
            })
        
        return Response({
            'point': {'latitude': lat, 'longitude': lng, 'altitude': altitude},
            'zones': [],
            'is_restricted': False
        })

