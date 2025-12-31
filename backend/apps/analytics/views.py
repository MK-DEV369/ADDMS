"""
Analytics viewsets
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from django.db.models import Q
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

        # Multiple services: support comma-separated or repeated params
        services_param = self.request.query_params.get('services') or self.request.query_params.get('service')
        if services_param and services_param.lower() != 'all':
            services = [s.strip() for s in services_param.split(',') if s.strip()]
            if services:
                queryset = queryset.filter(service__in=services)

        # Multiple levels (comma or repeated level param)
        levels_param = self.request.query_params.get('levels') or self.request.query_params.get('level')
        if levels_param and levels_param.lower() != 'all':
            levels = [l.strip() for l in levels_param.split(',') if l.strip()]
            if levels:
                queryset = queryset.filter(level__in=levels)

        # Text search across message, correlation_id, service
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(message__icontains=search)
                | Q(correlation_id__icontains=search)
                | Q(service__icontains=search)
            )

        # Optional max age in minutes
        max_age_minutes = self.request.query_params.get('max_age_minutes')
        if max_age_minutes:
            try:
                minutes = int(max_age_minutes)
                since = timezone.now() - timedelta(minutes=minutes)
                queryset = queryset.filter(timestamp__gte=since)
            except (TypeError, ValueError):
                pass

        # Get limit from query params with sane cap
        try:
            limit = int(self.request.query_params.get('limit', 500))
        except (TypeError, ValueError):
            limit = 500
        limit = min(max(limit, 1), 2000)

        return queryset.order_by('-timestamp')[:limit]
    
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

