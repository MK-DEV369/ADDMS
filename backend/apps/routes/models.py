"""
Route models for delivery routes
"""
from django.db import models
from django.contrib.gis.db import models as gis_models
from django.utils.translation import gettext_lazy as _
import structlog

logger = structlog.get_logger(__name__)


class Route(models.Model):
    """Optimized route for delivery"""
    
    delivery_order = models.OneToOneField(
        'deliveries.DeliveryOrder',
        on_delete=models.CASCADE,
        related_name='optimized_route'
    )
    
    # Route geometry (LineString)
    path = gis_models.LineStringField(
        geography=True,
        srid=4326,
        spatial_index=True,
        help_text="Optimized route path as LineString"
    )
    
    # Route metrics
    total_distance = models.DecimalField(max_digits=10, decimal_places=2, help_text="km")
    estimated_duration = models.IntegerField(help_text="minutes")
    estimated_eta = models.DateTimeField()
    
    # AI Model outputs
    confidence_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="AI model confidence (0-100)"
    )
    optimization_method = models.CharField(
        max_length=50,
        default='astar',
        help_text="Algorithm used (astar, dijkstra, rl)"
    )
    
    # Route constraints
    avoids_no_fly_zones = models.BooleanField(default=True)
    avoids_weather_hazards = models.BooleanField(default=True)
    altitude_profile = models.JSONField(
        default=dict,
        help_text="Altitude changes along route"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'route'
        verbose_name = _('Route')
        verbose_name_plural = _('Routes')
        indexes = [
            models.Index(fields=['estimated_eta']),
        ]
    
    def __str__(self):
        return f"Route for Order #{self.delivery_order.id}"


class Waypoint(models.Model):
    """Waypoint along a route"""
    
    route = models.ForeignKey(
        Route,
        on_delete=models.CASCADE,
        related_name='waypoints'
    )
    
    sequence = models.IntegerField(help_text="Order in route sequence")
    position = gis_models.PointField(
        geography=True,
        srid=4326,
        spatial_index=True
    )
    altitude = models.DecimalField(max_digits=6, decimal_places=2, help_text="meters")
    
    # Waypoint metadata
    action = models.CharField(
        max_length=50,
        default='waypoint',
        help_text="pickup, waypoint, delivery, avoid"
    )
    estimated_arrival = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'waypoint'
        verbose_name = _('Waypoint')
        verbose_name_plural = _('Waypoints')
        ordering = ['route', 'sequence']
        unique_together = [['route', 'sequence']]
        indexes = [
            models.Index(fields=['route', 'sequence']),
        ]
    
    def __str__(self):
        return f"Waypoint {self.sequence} for Route {self.route.id}"

