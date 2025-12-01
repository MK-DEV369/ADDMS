"""
Route viewsets
"""
from rest_framework import viewsets, permissions
from .models import Route, Waypoint
from .serializers import RouteSerializer, WaypointSerializer
from apps.users.permissions import IsAdminOrManager


class RouteViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Route (read-only, created by optimization task)"""
    queryset = Route.objects.all()
    serializer_class = RouteSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['delivery_order', 'optimization_method']
    ordering_fields = ['created_at', 'estimated_eta']


class WaypointViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Waypoint (read-only)"""
    queryset = Waypoint.objects.all()
    serializer_class = WaypointSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['route']

