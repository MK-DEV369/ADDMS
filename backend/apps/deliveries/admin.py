from django.contrib import admin
from django.contrib.gis.admin import OSMGeoAdmin
from .models import DeliveryOrder, Package, OrderStatusHistory


@admin.register(DeliveryOrder)
class DeliveryOrderAdmin(OSMGeoAdmin):
    """Admin interface for DeliveryOrder"""
    list_display = ['id', 'customer', 'status', 'drone', 'requested_at', 'estimated_eta']
    list_filter = ['status', 'requested_at', 'package__package_type']
    search_fields = ['customer__username', 'pickup_address', 'delivery_address']
    readonly_fields = ['requested_at', 'assigned_at', 'picked_up_at', 'delivered_at']


@admin.register(Package)
class PackageAdmin(admin.ModelAdmin):
    """Admin interface for Package"""
    list_display = ['name', 'package_type', 'weight', 'is_fragile', 'is_urgent']
    list_filter = ['package_type', 'is_fragile', 'is_urgent']


@admin.register(OrderStatusHistory)
class OrderStatusHistoryAdmin(admin.ModelAdmin):
    """Admin interface for OrderStatusHistory"""
    list_display = ['order', 'status', 'changed_by', 'timestamp']
    list_filter = ['status', 'timestamp']
    readonly_fields = ['timestamp']

