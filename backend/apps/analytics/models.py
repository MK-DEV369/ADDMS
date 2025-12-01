"""
Analytics models for fleet KPIs (TimescaleDB)
"""
from django.db import models
from django.utils.translation import gettext_lazy as _


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

