"""
Analytics viewsets
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import FleetAnalytics, SystemLog
from .serializers import FleetAnalyticsSerializer, SystemLogSerializer
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


class SystemLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for SystemLog"""
    queryset = SystemLog.objects.all().order_by('-timestamp')
    serializer_class = SystemLogSerializer
    permission_classes = [IsAdminOrManager]
    filterset_fields = ['level', 'service']
    ordering_fields = ['-timestamp', 'level', 'service']
    
    def get_queryset(self):
        """Get recent logs"""
        queryset = super().get_queryset()
        
        # Get limit from query params, default to 50
        limit = int(self.request.query_params.get('limit', 50))
        return queryset[:limit]
    
    @action(detail=False, methods=['post'])
    def cleanup(self, request):
        """Clean up old logs, keeping only last N"""
        keep_count = request.data.get('keep_count', 10)
        SystemLog.cleanup_old_logs(keep_count=keep_count)
        remaining_count = SystemLog.objects.count()
        return Response({
            'status': 'success',
            'message': f'Cleaned up logs, kept {min(remaining_count, keep_count)} recent logs',
            'remaining_count': remaining_count
        })
    
    @action(detail=False, methods=['post'])
    def clear_all(self, request):
        """Clear all logs (admin only)"""
        if not request.user.is_admin():
            return Response(
                {'error': 'Only admins can clear all logs'},
                status=status.HTTP_403_FORBIDDEN
            )
        count = SystemLog.objects.count()
        SystemLog.objects.all().delete()
        return Response({
            'status': 'success',
            'message': f'Cleared {count} logs',
            'remaining_count': 0
        })

