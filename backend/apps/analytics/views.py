"""
Analytics viewsets
"""
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import FleetAnalytics
from .serializers import FleetAnalyticsSerializer
from apps.users.permissions import IsAdminOrManager


class FleetAnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for FleetAnalytics"""
    queryset = FleetAnalytics.objects.all()
    serializer_class = FleetAnalyticsSerializer
    permission_classes = [IsAdminOrManager]
    ordering_fields = ['timestamp']
    
    def get_queryset(self):
        """Filter by time range"""
        queryset = super().get_queryset()
        
        days = int(self.request.query_params.get('days', 7))
        since = timezone.now() - timedelta(days=days)
        queryset = queryset.filter(timestamp__gte=since)
        
        return queryset.order_by('-timestamp')
    
    @action(detail=False, methods=['get'])
    def latest(self, request):
        """Get latest analytics snapshot"""
        from rest_framework.response import Response
        latest = FleetAnalytics.objects.order_by('-timestamp').first()
        if latest:
            serializer = self.get_serializer(latest)
            return Response(serializer.data)
        return Response({"error": "No analytics data available"}, status=404)

