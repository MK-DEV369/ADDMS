"""
Telemetry models for time-series drone sensor data (TimescaleDB)
"""
from django.db import models
from django.contrib.gis.db import models as gis_models
from django.utils.translation import gettext_lazy as _
import structlog

logger = structlog.get_logger(__name__)


class TelemetryData(models.Model):
    """
    Time-series telemetry data (TimescaleDB hypertable)
    Stores sensor readings from drones
    """
    
    drone = models.ForeignKey(
        'drones.Drone',
        on_delete=models.CASCADE,
        related_name='telemetry_data'
    )
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    
    # Position
    position = gis_models.PointField(
        geography=True,
        srid=4326,
        spatial_index=True
    )
    altitude = models.DecimalField(max_digits=6, decimal_places=2, help_text="meters")
    heading = models.DecimalField(max_digits=5, decimal_places=2, help_text="degrees")
    
    # Flight data
    speed = models.DecimalField(max_digits=6, decimal_places=2, help_text="km/h")
    battery_level = models.IntegerField()
    battery_voltage = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    
    # Environmental
    temperature = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    wind_speed = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    wind_direction = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # Status
    is_in_flight = models.BooleanField(default=True)
    gps_signal_strength = models.IntegerField(null=True, blank=True)
    
    class Meta:
        db_table = 'telemetry_data'
        verbose_name = _('Telemetry Data')
        verbose_name_plural = _('Telemetry Data')
        indexes = [
            models.Index(fields=['drone', 'timestamp']),
            models.Index(fields=['timestamp']),
        ]
        get_latest_by = 'timestamp'
    
    def __str__(self):
        return f"{self.drone.serial_number} - {self.timestamp}"


class DroneStatusStream(models.Model):
    """
    Real-time drone status stream (heartbeat & connectivity)
    """
    
    drone = models.OneToOneField(
        'drones.Drone',
        on_delete=models.CASCADE,
        related_name='status_stream'
    )
    
    is_online = models.BooleanField(default=False)
    last_heartbeat = models.DateTimeField(null=True, blank=True)
    connection_quality = models.IntegerField(
        default=100,
        help_text="0-100, connection quality percentage"
    )
    
    current_mission = models.ForeignKey(
        'deliveries.DeliveryOrder',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='status_streams'
    )
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'drone_status_stream'
        verbose_name = _('Drone Status Stream')
        verbose_name_plural = _('Drone Status Streams')
    
    def __str__(self):
        return f"{self.drone.serial_number} - {'Online' if self.is_online else 'Offline'}"

