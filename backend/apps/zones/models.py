"""
Zone models for operational and no-fly zones (PostGIS)
"""
from django.db import models
from django.contrib.gis.db import models as gis_models
from django.utils.translation import gettext_lazy as _
import structlog

logger = structlog.get_logger(__name__)


class OperationalZone(models.Model):
    """Operational zone where deliveries are allowed"""
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    boundary = gis_models.PolygonField(
        geography=True,
        srid=4326,
        spatial_index=True,
        help_text="Polygon defining the operational zone"
    )
    altitude_min = models.DecimalField(max_digits=6, decimal_places=2, default=0, help_text="meters")
    altitude_max = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, help_text="meters")
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        limit_choices_to={'role__in': ['admin', 'manager']}
    )
    
    class Meta:
        db_table = 'operational_zone'
        verbose_name = _('Operational Zone')
        verbose_name_plural = _('Operational Zones')
        indexes = [
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.name}"


class NoFlyZone(models.Model):
    """No-fly zone (restricted airspace)"""
    
    class ZoneType(models.TextChoices):
        AIRPORT = 'airport', _('Airport')
        MILITARY = 'military', _('Military')
        GOVERNMENT = 'government', _('Government')
        PRIVATE = 'private', _('Private Property')
        WEATHER = 'weather', _('Weather Hazard')
        TEMPORARY = 'temporary', _('Temporary Restriction')

    class Severity(models.TextChoices):
        RED = 'red', _('Red / hard no-fly')
        YELLOW = 'yellow', _('Yellow / warning (avoid)')
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    zone_type = models.CharField(max_length=20, choices=ZoneType.choices)
    severity = models.CharField(
        max_length=10,
        choices=Severity.choices,
        default=Severity.RED,
        db_index=True,
        help_text="red=no-fly, yellow=warning (treated as avoid)"
    )
    boundary = gis_models.PolygonField(
        geography=True,
        srid=4326,
        spatial_index=True,
        help_text="Polygon defining the no-fly zone"
    )
    altitude_min = models.DecimalField(max_digits=6, decimal_places=2, default=0, help_text="meters")
    altitude_max = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, help_text="meters")
    is_active = models.BooleanField(default=True)
    
    # Temporary restrictions
    valid_from = models.DateTimeField(null=True, blank=True)
    valid_until = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        limit_choices_to={'role__in': ['admin', 'manager']}
    )
    
    class Meta:
        db_table = 'no_fly_zone'
        verbose_name = _('No-Fly Zone')
        verbose_name_plural = _('No-Fly Zones')
        indexes = [
            models.Index(fields=['is_active', 'zone_type']),
            models.Index(fields=['valid_from', 'valid_until']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.zone_type})"
    
    @classmethod
    def check_point_intersection(cls, point, altitude=None):
        """
        Check if a point (and optionally altitude) intersects with any active no-fly zones
        Returns True if intersection found (i.e., point is in no-fly zone)
        """
        from django.contrib.gis.geos import Point
        from django.utils import timezone
        
        if isinstance(point, (tuple, list)):
            point = Point(point[0], point[1], srid=4326)
        
        zones = cls.objects.filter(is_active=True)
        
        # Check temporal validity
        now = timezone.now()
        zones = zones.filter(
            models.Q(valid_from__isnull=True) | models.Q(valid_from__lte=now),
            models.Q(valid_until__isnull=True) | models.Q(valid_until__gte=now)
        )
        
        # Check spatial intersection
        intersecting_zones = zones.filter(boundary__intersects=point)
        
        if altitude is not None:
            # Also check altitude range
            intersecting_zones = intersecting_zones.filter(
                models.Q(altitude_min__lte=altitude) &
                (models.Q(altitude_max__isnull=True) | models.Q(altitude_max__gte=altitude))
            )
        
        return intersecting_zones.exists()

