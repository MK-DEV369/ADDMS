"""
Celery tasks for analytics aggregation
"""
from celery import shared_task
from django.utils import timezone
from django.db.models import Avg, Count, Q
from datetime import timedelta
import structlog

logger = structlog.get_logger(__name__)


@shared_task(bind=True)
def update_fleet_metrics(self):
    """
    Periodic task to update fleet analytics metrics
    Run every 15 minutes via Celery Beat
    """
    try:
        from apps.drones.models import Drone
        from apps.deliveries.models import DeliveryOrder
        from .models import FleetAnalytics
        
        logger.info("Updating fleet metrics", namespace="analytics")
        
        # Fleet metrics
        total_drones = Drone.objects.count()
        active_drones = Drone.objects.filter(is_active=True).count()
        drones_in_flight = Drone.objects.filter(
            status__in=[Drone.Status.IN_FLIGHT, Drone.Status.DELIVERING]
        ).count()
        drones_in_maintenance = Drone.objects.filter(
            status=Drone.Status.MAINTENANCE
        ).count()
        
        # Delivery metrics (last 24 hours)
        since = timezone.now() - timedelta(days=1)
        orders = DeliveryOrder.objects.filter(requested_at__gte=since)
        
        total_orders = orders.count()
        pending_orders = orders.filter(status=DeliveryOrder.Status.PENDING).count()
        completed_orders = orders.filter(status=DeliveryOrder.Status.DELIVERED).count()
        failed_orders = orders.filter(status=DeliveryOrder.Status.FAILED).count()
        
        # Performance metrics
        delivered_orders = orders.filter(status=DeliveryOrder.Status.DELIVERED)
        avg_delivery_time = None
        avg_eta_accuracy = None
        
        if delivered_orders.exists():
            # Calculate average delivery time
            delivery_times = []
            for order in delivered_orders:
                if order.delivered_at and order.assigned_at:
                    duration = (order.delivered_at - order.assigned_at).total_seconds() / 60
                    delivery_times.append(duration)
                    
                    # Calculate ETA accuracy
                    if order.estimated_eta and order.delivered_at:
                        diff = abs((order.delivered_at - order.estimated_eta).total_seconds() / 60)
                        if duration > 0:
                            accuracy = max(0, 100 - (diff / duration * 100))
                            # Store for averaging
        
            if delivery_times:
                avg_delivery_time = sum(delivery_times) / len(delivery_times)
        
        # Battery metrics
        battery_levels = Drone.objects.filter(is_active=True).values_list('battery_level', flat=True)
        avg_battery = sum(battery_levels) / len(battery_levels) if battery_levels else None
        low_battery_count = Drone.objects.filter(battery_level__lt=20).count()
        
        # Create analytics snapshot
        FleetAnalytics.objects.create(
            total_drones=total_drones,
            active_drones=active_drones,
            drones_in_flight=drones_in_flight,
            drones_in_maintenance=drones_in_maintenance,
            total_orders=total_orders,
            pending_orders=pending_orders,
            completed_orders=completed_orders,
            failed_orders=failed_orders,
            avg_delivery_time_minutes=avg_delivery_time,
            avg_battery_level=avg_battery,
            low_battery_count=low_battery_count
        )
        
        logger.info(
            "Fleet metrics updated",
            namespace="analytics",
            total_drones=total_drones,
            active_drones=active_drones
        )
        
    except Exception as exc:
        logger.error(
            "Failed to update fleet metrics",
            namespace="analytics",
            error=str(exc)
        )
        raise

