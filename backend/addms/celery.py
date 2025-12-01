"""
Celery configuration for ADDMS
Handles async task processing with Redis as broker
"""
import os
import structlog
from celery import Celery

logger = structlog.get_logger(__name__)

# Set default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'addms.settings')

app = Celery('addms')

# Load configuration from Django settings
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks from all installed apps
app.autodiscover_tasks()

logger.info("Celery app initialized", namespace="celery")

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Debug task to verify Celery is working"""
    logger.info(f'Request: {self.request!r}', namespace="celery.debug")

