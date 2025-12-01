"""
Delivery viewsets
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
import structlog

from .models import DeliveryOrder, Package, OrderStatusHistory
from .serializers import (
    DeliveryOrderSerializer,
    PackageSerializer,
    OrderStatusHistorySerializer
)
from apps.users.permissions import IsAdminOrManager

logger = structlog.get_logger(__name__)


class DeliveryOrderViewSet(viewsets.ModelViewSet):
    """ViewSet for DeliveryOrder"""
    queryset = DeliveryOrder.objects.all()
    serializer_class = DeliveryOrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status', 'customer', 'drone', 'package__package_type']
    search_fields = ['pickup_address', 'delivery_address', 'package__name']
    ordering_fields = ['requested_at', 'priority', 'estimated_eta']
    
    def get_queryset(self):
        """Filter orders based on user role"""
        user = self.request.user
        
        if user.is_customer():
            return DeliveryOrder.objects.filter(customer=user)
        elif user.is_admin() or user.is_manager():
            return DeliveryOrder.objects.all()
        
        return DeliveryOrder.objects.none()
    
    def perform_create(self, serializer):
        """Set customer to current user if customer"""
        user = self.request.user
        if user.is_customer():
            serializer.save(customer=user)
        else:
            serializer.save()
        
        logger.info("Delivery order created", namespace="deliveries", user_id=user.id)
    
    @action(detail=True, methods=['post'])
    def assign_drone(self, request, pk=None):
        """Assign drone to delivery (manager/admin only)"""
        if not (request.user.is_admin() or request.user.is_manager()):
            return Response(
                {"error": "Permission denied"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        order = self.get_object()
        drone_id = request.data.get('drone_id')
        
        if not drone_id:
            return Response(
                {"error": "drone_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from apps.drones.models import Drone
        try:
            drone = Drone.objects.get(id=drone_id, is_active=True)
        except Drone.DoesNotExist:
            return Response(
                {"error": "Drone not found or inactive"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Trigger async task to assign drone
        from apps.deliveries.tasks import assign_drone_to_delivery
        assign_drone_to_delivery.delay(order.id, drone.id)
        
        logger.info(
            "Drone assignment initiated",
            namespace="deliveries",
            order_id=order.id,
            drone_id=drone.id
        )
        
        return Response({"message": "Drone assignment initiated"})
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update order status"""
        order = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in [choice[0] for choice in DeliveryOrder.Status.choices]:
            return Response(
                {"error": "Invalid status"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_status = order.status
        order.status = new_status
        
        # Update timestamps
        now = timezone.now()
        if new_status == DeliveryOrder.Status.ASSIGNED and not order.assigned_at:
            order.assigned_at = now
        elif new_status == DeliveryOrder.Status.IN_TRANSIT and not order.picked_up_at:
            order.picked_up_at = now
        elif new_status == DeliveryOrder.Status.DELIVERED:
            order.delivered_at = now
            order.actual_delivery_time = now
        
        order.save()
        
        # Create status history
        OrderStatusHistory.objects.create(
            order=order,
            status=new_status,
            changed_by=request.user,
            notes=request.data.get('notes')
        )
        
        logger.info(
            "Order status updated",
            namespace="deliveries",
            order_id=order.id,
            old_status=old_status,
            new_status=new_status
        )
        
        return Response(DeliveryOrderSerializer(order).data)


class PackageViewSet(viewsets.ModelViewSet):
    """ViewSet for Package"""
    queryset = Package.objects.all()
    serializer_class = PackageSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['package_type', 'is_fragile', 'is_urgent']


class OrderStatusHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for OrderStatusHistory (read-only)"""
    queryset = OrderStatusHistory.objects.all()
    serializer_class = OrderStatusHistorySerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['order', 'status']

