"""
Celery tasks for delivery management
"""
from celery import shared_task
from django.utils import timezone
import structlog

logger = structlog.get_logger(__name__)


@shared_task(bind=True, max_retries=3)
def assign_drone_to_delivery(self, order_id, drone_id):
    """
    Assign drone to delivery order and trigger route optimization
    """
    try:
        from .models import DeliveryOrder, OrderStatusHistory
        from apps.drones.models import Drone
        from apps.routes.tasks import optimize_route_and_predict_eta
        from apps.notifications.tasks import notify_customer_event
        
        order = DeliveryOrder.objects.get(id=order_id)
        drone = Drone.objects.get(id=drone_id)
        
        logger.info(
            "Assigning drone to delivery",
            namespace="deliveries",
            order_id=order_id,
            drone_id=drone_id
        )
        
        # Update order
        order.drone = drone
        order.status = DeliveryOrder.Status.ASSIGNED
        order.assigned_at = timezone.now()
        order.save()
        
        # Update drone status
        drone.status = Drone.Status.ASSIGNED
        drone.save()
        
        # Create status history
        OrderStatusHistory.objects.create(
            order=order,
            status=DeliveryOrder.Status.ASSIGNED,
            notes=f"Assigned to drone {drone.serial_number}"
        )
        
        # Trigger route optimization
        optimize_route_and_predict_eta.delay(order.id)
        
        # Notify customer
        notify_customer_event.delay(
            user_id=order.customer.id,
            event_type='delivery_assigned',
            title='Drone Assigned',
            message=f'Drone {drone.serial_number} has been assigned to your delivery.',
            related_object_id=order.id,
            related_object_type='delivery_order'
        )
        
        logger.info(
            "Drone assigned successfully",
            namespace="deliveries",
            order_id=order_id,
            drone_id=drone_id
        )
        
    except Exception as exc:
        logger.error(
            "Failed to assign drone",
            namespace="deliveries",
            order_id=order_id,
            drone_id=drone_id,
            error=str(exc)
        )
        raise self.retry(exc=exc, countdown=60)
