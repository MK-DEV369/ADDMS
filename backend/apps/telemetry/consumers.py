"""
WebSocket consumers for real-time drone tracking
"""
import json
import structlog
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

User = get_user_model()
logger = structlog.get_logger(__name__)


class DroneTrackingConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time drone tracking"""
    
    async def connect(self):
        """Handle WebSocket connection"""
        self.user = self.scope["user"]
        
        if not self.user.is_authenticated:
            await self.close()
            return
        
        # Join group for all drone updates
        await self.channel_layer.group_add("drone_updates", self.channel_name)
        
        # Join group for user-specific updates
        await self.channel_layer.group_add(f"user_{self.user.id}", self.channel_name)
        
        await self.accept()
        
        logger.info(
            "WebSocket connected",
            namespace="telemetry",
            user_id=self.user.id,
            username=self.user.username
        )
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        await self.channel_layer.group_discard("drone_updates", self.channel_name)
        await self.channel_layer.group_discard(f"user_{self.user.id}", self.channel_name)
        
        logger.info(
            "WebSocket disconnected",
            namespace="telemetry",
            user_id=self.user.id,
            close_code=close_code
        )
    
    async def receive(self, text_data):
        """Handle messages from client"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'subscribe_drone':
                # Subscribe to specific drone updates
                drone_id = data.get('drone_id')
                if drone_id:
                    await self.channel_layer.group_add(f"drone_{drone_id}", self.channel_name)
                    logger.debug(
                        "Subscribed to drone",
                        namespace="telemetry",
                        drone_id=drone_id,
                        user_id=self.user.id
                    )
            
            elif message_type == 'unsubscribe_drone':
                # Unsubscribe from specific drone
                drone_id = data.get('drone_id')
                if drone_id:
                    await self.channel_layer.group_discard(f"drone_{drone_id}", self.channel_name)
        
        except json.JSONDecodeError:
            logger.warning("Invalid JSON received", namespace="telemetry")
    
    async def drone_update(self, event):
        """Send drone update to client"""
        await self.send(text_data=json.dumps({
            'type': 'drone_update',
            'data': event['data']
        }))
    
    async def telemetry_data(self, event):
        """Send telemetry data to client"""
        await self.send(text_data=json.dumps({
            'type': 'telemetry',
            'data': event['data']
        }))
    
    async def delivery_update(self, event):
        """Send delivery update to client"""
        await self.send(text_data=json.dumps({
            'type': 'delivery_update',
            'data': event['data']
        }))

