"""
WebSocket routing for telemetry
"""
from django.urls import re_path
from .consumers import DroneTrackingConsumer

websocket_urlpatterns = [
    re_path(r'ws/tracking/$', DroneTrackingConsumer.as_asgi()),
]

