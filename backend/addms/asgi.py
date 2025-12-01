"""
ASGI config for ADDMS project with WebSocket support.
"""
import os
import structlog
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'addms.settings')

django_asgi_app = get_asgi_application()

logger = structlog.get_logger(__name__)

# Import routing after Django setup
from apps.telemetry.routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(websocket_urlpatterns)
        )
    ),
})

logger.info("ASGI application configured with WebSocket support", namespace="asgi")

