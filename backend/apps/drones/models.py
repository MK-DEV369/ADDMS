"""
Drone models for fleet management
"""
from django.db import models
from django.contrib.gis.db import models as gis_models
from django.contrib.gis.geos import Point
from django.utils.translation import gettext_lazy as _
import structlog

logger = structlog.get_logger(__name__)


class Drone(models.Model):
    """Drone model with specifications and status"""
    
    class Status(models.TextChoices):
        IDLE = 'idle', _('Idle')
        CHARGING = 'charging', _('Charging')
        ASSIGNED = 'assigned', _('Assigned to Delivery')
        DELIVERING = 'delivering', _('Delivering')
        RETURNING = 'returning', _('Returning to Base')
        MAINTENANCE = 'maintenance', _('Under Maintenance')
        OFFLINE = 'offline', _('Offline')
    
    # Basic Information
    serial_number = models.CharField(max_length=100, unique=True, db_index=True)
    model = models.CharField(max_length=100)
    manufacturer = models.CharField(max_length=100)
    
    # Specifications
    max_payload_weight = models.DecimalField(max_digits=6, decimal_places=2, help_text="kg")
    max_speed = models.DecimalField(max_digits=6, decimal_places=2, help_text="km/h")
    max_altitude = models.DecimalField(max_digits=6, decimal_places=2, help_text="meters")
    max_range = models.DecimalField(max_digits=6, decimal_places=2, help_text="km")
    battery_capacity = models.DecimalField(max_digits=6, decimal_places=2, help_text="mAh")
    
    # Current State
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.IDLE,
        db_index=True
    )
    battery_level = models.IntegerField(default=100, help_text="Percentage")
    current_position = gis_models.PointField(
        geography=True,
        srid=4326,
        null=True,
        blank=True,
        spatial_index=True
    )
    current_altitude = models.DecimalField(max_digits=6, decimal_places=2, default=0, help_text="meters")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_heartbeat = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    notes = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'drone'
        verbose_name = _('Drone')
        verbose_name_plural = _('Drones')
        indexes = [
            models.Index(fields=['status', 'is_active']),
            models.Index(fields=['serial_number']),
        ]
    
    def __str__(self):
        return f"{self.model} - {self.serial_number}"
    
    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        logger.info(
            "Drone saved",
            namespace="drones",
            drone_id=self.id,
            serial_number=self.serial_number,
            status=self.status,
            is_new=is_new
        )


class MaintenanceLog(models.Model):
    """Maintenance log for drones"""
    
    class MaintenanceType(models.TextChoices):
        ROUTINE = 'routine', _('Routine')
        REPAIR = 'repair', _('Repair')
        UPGRADE = 'upgrade', _('Upgrade')
        INSPECTION = 'inspection', _('Inspection')
    
    drone = models.ForeignKey(Drone, on_delete=models.CASCADE, related_name='maintenance_logs')
    maintenance_type = models.CharField(max_length=20, choices=MaintenanceType.choices)
    description = models.TextField()
    performed_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        limit_choices_to={'role__in': ['admin', 'manager']}
    )
    scheduled_at = models.DateTimeField()
    completed_at = models.DateTimeField(null=True, blank=True)
    cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'maintenance_log'
        verbose_name = _('Maintenance Log')
        verbose_name_plural = _('Maintenance Logs')
        indexes = [
            models.Index(fields=['drone', 'scheduled_at']),
        ]
    
    def __str__(self):
        return f"{self.drone.serial_number} - {self.maintenance_type} - {self.scheduled_at}"

