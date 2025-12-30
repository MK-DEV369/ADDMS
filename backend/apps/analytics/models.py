"""
Analytics models for fleet KPIs (TimescaleDB)
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
import structlog

logger = structlog.get_logger(__name__)


class FleetAnalytics(models.Model):
    """
    Fleet analytics snapshot (TimescaleDB hypertable)
    Stores aggregated KPIs over time
    """
    
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    
    # Fleet metrics
    total_drones = models.IntegerField()
    active_drones = models.IntegerField()
    drones_in_flight = models.IntegerField()
    drones_in_maintenance = models.IntegerField()
    
    # Delivery metrics
    total_orders = models.IntegerField()
    pending_orders = models.IntegerField()
    completed_orders = models.IntegerField()
    failed_orders = models.IntegerField()
    
    # Performance metrics
    avg_delivery_time_minutes = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    avg_eta_accuracy_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    total_distance_km = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Battery metrics
    avg_battery_level = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    low_battery_count = models.IntegerField(default=0)
    
    # Uptime metrics
    fleet_uptime_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    class Meta:
        db_table = 'fleet_analytics'
        verbose_name = _('Fleet Analytics')
        verbose_name_plural = _('Fleet Analytics')
        indexes = [
            models.Index(fields=['timestamp']),
        ]
        get_latest_by = 'timestamp'
    
    def __str__(self):
        return f"Fleet Analytics - {self.timestamp}"


class SystemLog(models.Model):
    """System log model to store application logs"""
    
    class LogLevel(models.TextChoices):
        DEBUG = 'debug', _('Debug')
        INFO = 'info', _('Info')
        WARNING = 'warning', _('Warning')
        ERROR = 'error', _('Error')
        CRITICAL = 'critical', _('Critical')
    
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    level = models.CharField(
        max_length=20,
        choices=LogLevel.choices,
        default=LogLevel.INFO,
        db_index=True
    )
    service = models.CharField(max_length=100, db_index=True)  # backend, celery, channels, etc.
    message = models.TextField()
    correlation_id = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    user = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='system_logs'
    )
    metadata = models.JSONField(default=dict, blank=True)  # Additional context data
    
    class Meta:
        db_table = 'system_log'
        verbose_name = _('System Log')
        verbose_name_plural = _('System Logs')
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['level', '-timestamp']),
            models.Index(fields=['service', '-timestamp']),
        ]
    
    def __str__(self):
        return f"[{self.get_level_display()}] {self.service} - {self.message[:100]}"
    
    @classmethod
    def log(cls, level, service, message, correlation_id=None, user=None, metadata=None):
        """Create a log entry"""
        return cls.objects.create(
            level=level,
            service=service,
            message=message,
            correlation_id=correlation_id,
            user=user,
            metadata=metadata or {}
        )
    
    @classmethod
    def cleanup_old_logs(cls, keep_count=10):
        """Keep only the last N logs in database"""
        total_count = cls.objects.count()
        if total_count > keep_count:
            # Get the ID of the Nth most recent log
            keep_until = cls.objects.order_by('-timestamp')[keep_count - 1]
            # Delete everything older than that
            cls.objects.filter(timestamp__lt=keep_until.timestamp).delete()
            logger.info(
                "Cleaned up old logs",
                namespace="logs",
                kept_count=keep_count,
                deleted_count=total_count - keep_count
            )

