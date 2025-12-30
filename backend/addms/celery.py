"""
Celery configuration for ADDMS
Handles async task processing with Redis as broker
"""
import os
import sys

# Set default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'addms.settings')

from celery import Celery

app = Celery('addms')

# Load configuration from Django settings
app.config_from_object('django.conf:settings', namespace='CELERY')

# Windows compatibility: Use solo pool for development
# This avoids fork() and multiprocessing issues on Windows
if sys.platform == 'win32':
    app.conf.update(
        worker_pool='solo',
        task_always_eager=False,
        task_eager_propagates=False,
    )

# Auto-discover tasks from all installed apps
app.autodiscover_tasks()

try:
    import structlog
    logger = structlog.get_logger(__name__)
    logger.info("Celery app initialized", namespace="celery", platform=sys.platform)
except ImportError:
    print(f"Celery app initialized (platform={sys.platform})")

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Debug task to verify Celery is working"""
    try:
        import structlog
        logger = structlog.get_logger(__name__)
        logger.info(f'Request: {self.request!r}', namespace="celery.debug")
    except ImportError:
        print(f'Debug task executed: {self.request!r}')

