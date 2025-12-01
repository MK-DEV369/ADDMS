"""
Celery tasks for notifications
"""
from celery import shared_task
import structlog

logger = structlog.get_logger(__name__)


@shared_task(bind=True)
def notify_customer_event(
    self,
    user_id,
    event_type,
    title,
    message,
    related_object_id=None,
    related_object_type=None
):
    """
    Create notification for customer
    """
    try:
        from django.contrib.auth import get_user_model
        from .models import Notification
        
        User = get_user_model()
        user = User.objects.get(id=user_id)
        
        Notification.objects.create(
            user=user,
            notification_type=event_type,
            title=title,
            message=message,
            related_object_id=related_object_id,
            related_object_type=related_object_type
        )
        
        logger.info(
            "Notification created",
            namespace="notifications",
            user_id=user_id,
            event_type=event_type
        )
        
    except Exception as exc:
        logger.error(
            "Failed to create notification",
            namespace="notifications",
            user_id=user_id,
            error=str(exc)
        )
        raise

