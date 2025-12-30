"""
Celery tasks for drone operations
"""
from celery import shared_task
from django.utils import timezone
import structlog

logger = structlog.get_logger(__name__)


@shared_task(bind=True)
def simulate_battery_drain(self):
    """
    Simulate battery drain for all active drones
    Runs periodically to decrease battery levels based on drone status
    """
    from .models import Drone
    
    try:
        # Get all active drones
        active_drones = Drone.objects.filter(is_active=True)
        updated_count = 0
        
        for drone in active_drones:
            original_battery = drone.battery_level
            drain_rate = 0
            
            # Different drain rates based on status
            if drone.status == Drone.Status.DELIVERING:
                drain_rate = 0.5  # 0.5% per minute when delivering
            elif drone.status == Drone.Status.RETURNING:
                drain_rate = 0.4  # 0.4% per minute when returning
            elif drone.status == Drone.Status.ASSIGNED:
                drain_rate = 0.3  # 0.3% per minute when assigned
            elif drone.status == Drone.Status.IDLE:
                drain_rate = 0.05  # 0.05% per minute when idle (very slow)
            elif drone.status == Drone.Status.CHARGING:
                # Charging increases battery
                if drone.battery_level < 100:
                    drone.battery_level = min(100, drone.battery_level + 2)  # +2% per minute
                    drone.save(update_fields=['battery_level'])
                continue
            elif drone.status in [Drone.Status.MAINTENANCE, Drone.Status.OFFLINE]:
                # No drain when in maintenance or offline
                continue
            
            # Apply battery drain
            if drone.battery_level > 0:
                drone.battery_level = max(0, drone.battery_level - drain_rate)
                drone.save(update_fields=['battery_level'])
                updated_count += 1
                
                # Auto-switch to charging if battery is critical
                if drone.battery_level <= 20 and drone.status == Drone.Status.IDLE:
                    drone.status = Drone.Status.CHARGING
                    drone.save(update_fields=['status'])
                    logger.warning(
                        "Drone battery critical, auto-switching to charging",
                        namespace="drones",
                        drone_id=drone.id,
                        battery_level=drone.battery_level
                    )
        
        logger.info(
            "Battery drain simulation completed",
            namespace="drones",
            total_drones=active_drones.count(),
            updated_count=updated_count
        )
        
        return {
            'status': 'success',
            'total_drones': active_drones.count(),
            'updated_count': updated_count
        }
        
    except Exception as e:
        logger.error(
            "Battery drain simulation failed",
            namespace="drones",
            error=str(e)
        )
        raise


@shared_task(bind=True)
def auto_charge_idle_drones(self):
    """
    Automatically set idle drones with low battery to charging status
    """
    from .models import Drone
    
    try:
        low_battery_drones = Drone.objects.filter(
            is_active=True,
            status=Drone.Status.IDLE,
            battery_level__lte=30
        )
        
        updated_count = 0
        for drone in low_battery_drones:
            drone.status = Drone.Status.CHARGING
            drone.save(update_fields=['status'])
            updated_count += 1
            
            logger.info(
                "Auto-charging drone",
                namespace="drones",
                drone_id=drone.id,
                battery_level=drone.battery_level
            )
        
        return {
            'status': 'success',
            'updated_count': updated_count
        }
        
    except Exception as e:
        logger.error(
            "Auto-charge task failed",
            namespace="drones",
            error=str(e)
        )
        raise
