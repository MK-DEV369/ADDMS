"""
Delivery order models
"""
from django.db import models
from django.contrib.gis.db import models as gis_models
from django.contrib.gis.geos import Point
from django.utils.translation import gettext_lazy as _
import structlog

logger = structlog.get_logger(__name__)


class DeliveryOrder(models.Model):
    """Delivery order model"""
    
    class Status(models.TextChoices):
        PENDING = 'pending', _('Pending')
        ASSIGNED = 'assigned', _('Assigned to Drone')
        IN_TRANSIT = 'in_transit', _('In Transit')
        DELIVERING = 'delivering', _('Out for Delivery')
        DELIVERED = 'delivered', _('Delivered')
        FAILED = 'failed', _('Failed')
        CANCELLED = 'cancelled', _('Cancelled')
    
    # Customer Information
    customer = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='orders',
        limit_choices_to={'role': 'customer'}
    )
    
    # Delivery Details
    pickup_address = models.TextField(blank=True, null=True)
    pickup_location = gis_models.PointField(geography=True, srid=4326, spatial_index=True, blank=True, null=True)
    delivery_address = models.TextField()
    delivery_location = gis_models.PointField(geography=True, srid=4326, spatial_index=True)
    
    # Package Information
    package = models.OneToOneField('Package', on_delete=models.CASCADE, related_name='order')
    
    # Assignment
    drone = models.ForeignKey(
        'drones.Drone',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='deliveries'
    )
    
    # Status & Tracking
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True
    )
    
    # Timestamps
    requested_at = models.DateTimeField(auto_now_add=True)
    assigned_at = models.DateTimeField(null=True, blank=True)
    picked_up_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    
    # ETA & Route
    estimated_eta = models.DateTimeField(null=True, blank=True)
    actual_delivery_time = models.DateTimeField(null=True, blank=True)
    # Route is accessed via optimized_route (reverse of OneToOneField in Route model)
    # Keeping this field for backward compatibility, but it should use optimized_route instead
    # route = models.ForeignKey(
    #     'routes.Route',
    #     on_delete=models.SET_NULL,
    #     null=True,
    #     blank=True,
    #     related_name='delivery_orders'
    # )
    
    # Metadata
    priority = models.IntegerField(default=1, help_text="Higher number = higher priority")
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'delivery_order'
        verbose_name = _('Delivery Order')
        verbose_name_plural = _('Delivery Orders')
        indexes = [
            models.Index(fields=['status', 'customer']),
            models.Index(fields=['drone', 'status']),
            models.Index(fields=['requested_at']),
        ]
    
    def __str__(self):
        return f"Order #{self.id} - {self.customer.username} - {self.status}"


class Package(models.Model):
    """Package model"""
    
    class PackageType(models.TextChoices):
        DOCUMENT = 'document', _('Document')
        FOOD = 'food', _('Food')
        MEDICAL = 'medical', _('Medical')
        ELECTRONICS = 'electronics', _('Electronics')
        OTHER = 'other', _('Other')
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    package_type = models.CharField(max_length=20, choices=PackageType.choices, default=PackageType.OTHER)
    weight = models.DecimalField(max_digits=6, decimal_places=2, help_text="kg")
    dimensions_length = models.DecimalField(max_digits=6, decimal_places=2, help_text="cm", null=True, blank=True)
    dimensions_width = models.DecimalField(max_digits=6, decimal_places=2, help_text="cm", null=True, blank=True)
    dimensions_height = models.DecimalField(max_digits=6, decimal_places=2, help_text="cm", null=True, blank=True)
    
    # Special handling
    is_fragile = models.BooleanField(default=False)
    is_urgent = models.BooleanField(default=False)
    requires_temperature_control = models.BooleanField(default=False)
    temperature_range = models.CharField(max_length=50, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'package'
        verbose_name = _('Package')
        verbose_name_plural = _('Packages')
    
    def __str__(self):
        return f"{self.name} ({self.weight}kg)"


class OrderStatusHistory(models.Model):
    """Track order status changes"""
    order = models.ForeignKey(DeliveryOrder, on_delete=models.CASCADE, related_name='status_history')
    status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True
    )
    notes = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'order_status_history'
        verbose_name = _('Order Status History')
        verbose_name_plural = _('Order Status Histories')
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['order', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.order.id} - {self.status} - {self.timestamp}"

