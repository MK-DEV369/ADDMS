"""
Celery tasks for telemetry processing
"""
from celery import shared_task
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import structlog

from apps.analytics.models import SystemLog
from .models import DroneStatusStream

logger = structlog.get_logger(__name__)
channel_layer = get_channel_layer()


@shared_task(bind=True)
def process_live_telemetry(self, drone_id, telemetry_data):
    """
    Process incoming telemetry data and broadcast via WebSocket
    """
    try:
        from apps.drones.models import Drone
        from .models import TelemetryData
        from django.contrib.gis.geos import Point
        
        drone = Drone.objects.get(id=drone_id)
        
        # Extract position
        lat = telemetry_data.get('latitude')
        lng = telemetry_data.get('longitude')
        altitude = telemetry_data.get('altitude', 0)
        
        if lat and lng:
            position = Point(float(lng), float(lat), srid=4326)
        else:
            position = drone.current_position
        
        # Create telemetry record
        telemetry = TelemetryData.objects.create(
            drone=drone,
            position=position,
            altitude=telemetry_data.get('altitude', 0),
            heading=telemetry_data.get('heading', 0),
            speed=telemetry_data.get('speed', 0),
            battery_level=telemetry_data.get('battery_level', drone.battery_level),
            battery_voltage=telemetry_data.get('battery_voltage'),
            temperature=telemetry_data.get('temperature'),
            wind_speed=telemetry_data.get('wind_speed'),
            wind_direction=telemetry_data.get('wind_direction'),
            is_in_flight=telemetry_data.get('is_in_flight', True),
            gps_signal_strength=telemetry_data.get('gps_signal_strength')
        )
        
        # Update drone current position/state
        drone.current_position = position
        drone.current_altitude = altitude
        drone.battery_level = telemetry_data.get('battery_level', drone.battery_level)
        drone.last_heartbeat = timezone.now()
        drone.status = Drone.Status.IN_FLIGHT if telemetry_data.get('is_in_flight', True) else drone.status
        drone.save()

        # Upsert status stream heartbeat
        DroneStatusStream.objects.update_or_create(
            drone=drone,
            defaults={
                'is_online': True,
                'last_heartbeat': timezone.now(),
                'connection_quality': telemetry_data.get('connection_quality', 100),
                'current_mission_id': telemetry_data.get('mission_id')
            }
        )
        
        # Broadcast via WebSocket
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                "drone_updates",
                {
                    'type': 'drone_update',
                    'data': {
                        'drone_id': drone.id,
                        'serial_number': drone.serial_number,
                        'position': {
                            'latitude': lat,
                            'longitude': lng,
                            'altitude': float(altitude)
                        },
                        'battery_level': drone.battery_level,
                        'speed': telemetry_data.get('speed', 0),
                        'heading': telemetry_data.get('heading', 0),
                        'timestamp': telemetry.timestamp.isoformat()
                    }
                }
            )
            
            # Also send to drone-specific group
            async_to_sync(channel_layer.group_send)(
                f"drone_{drone.id}",
                {
                    'type': 'telemetry_data',
                    'data': {
                        'drone_id': drone.id,
                        'telemetry': {
                            'position': {'lat': lat, 'lng': lng, 'altitude': altitude},
                            'battery_level': drone.battery_level,
                            'speed': telemetry_data.get('speed', 0),
                            'heading': telemetry_data.get('heading', 0),
                            'temperature': telemetry_data.get('temperature'),
                            'wind_speed': telemetry_data.get('wind_speed')
                        },
                        'timestamp': telemetry.timestamp.isoformat()
                    }
                }
            )
        
        logger.debug(
            "Telemetry processed",
            namespace="telemetry",
            drone_id=drone.id,
            timestamp=telemetry.timestamp.isoformat()
        )

        SystemLog.log(
            level=SystemLog.LogLevel.INFO,
            service='telemetry',
            message=f"Telemetry updated for drone {drone.serial_number}",
            metadata={
                'drone_id': drone.id,
                'timestamp': telemetry.timestamp.isoformat(),
                'battery_level': telemetry.battery_level,
                'speed': telemetry.speed,
            }
        )
        
    except Exception as exc:
        logger.error(
            "Failed to process telemetry",
            namespace="telemetry",
            drone_id=drone_id,
            error=str(exc)
        )
        SystemLog.log(
            level=SystemLog.LogLevel.ERROR,
            service='telemetry',
            message=f"Failed telemetry ingest for drone {drone_id}",
            metadata={'error': str(exc)}
        )
        raise

