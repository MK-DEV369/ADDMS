"""
Delivery URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DeliveryOrderViewSet, PackageViewSet, OrderStatusHistoryViewSet

router = DefaultRouter()
router.register(r'orders', DeliveryOrderViewSet, basename='delivery-order')
router.register(r'packages', PackageViewSet, basename='package')
router.register(r'status-history', OrderStatusHistoryViewSet, basename='order-status-history')

app_name = 'deliveries'

urlpatterns = [
    path('', include(router.urls)),
]

