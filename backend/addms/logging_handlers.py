"""
Custom logging handlers for storing logs in database
"""
import logging
import structlog
from django.db import connection
from django.core.management import call_command


class SystemLogHandler(logging.Handler):
    """
    Custom logging handler that saves logs to the SystemLog model
    """
    
    def emit(self, record):
        """
        Emit a log record to the database
        """
        try:
            # Avoid circular imports
            from apps.analytics.models import SystemLog
            
            # Skip if database table doesn't exist yet
            if not self._table_exists('system_log'):
                return
            
            level = record.levelname.lower()
            
            # Map Python logging levels to model choices
            level_map = {
                'debug': 'debug',
                'info': 'info',
                'warning': 'warning',
                'error': 'error',
                'critical': 'critical'
            }
            
            log_level = level_map.get(level, 'info')
            
            # Extract service from logger name
            service = record.name.split('.')[0] if record.name else 'backend'
            if service == 'apps':
                service = record.name.split('.')[1] if len(record.name.split('.')) > 1 else 'backend'
            
            # Get correlation ID from record if available
            correlation_id = getattr(record, 'correlation_id', None)
            
            SystemLog.log(
                level=log_level,
                service=service,
                message=record.getMessage(),
                correlation_id=correlation_id
            )
            
            # Cleanup old logs periodically (every 100 logs)
            if SystemLog.objects.count() % 100 == 0:
                SystemLog.cleanup_old_logs(keep_count=10)
                
        except Exception:
            # Don't let logging errors crash the app
            pass
    
    @staticmethod
    def _table_exists(table_name):
        """Check if a table exists in the database"""
        try:
            cursor = connection.cursor()
            cursor.execute(f"SELECT 1 FROM information_schema.tables WHERE table_name = '{table_name}'")
            return cursor.fetchone() is not None
        except:
            return False


class StructlogDatabaseProcessor:
    """
    Processor for structlog that can save to database
    """
    
    def __call__(self, logger, name, event_dict):
        """
        Process a structlog event
        """
        try:
            from apps.analytics.models import SystemLog
            
            # Check if table exists
            if not self._table_exists('system_log'):
                return event_dict
            
            # Extract log level
            level = event_dict.pop('level', 'info') if isinstance(event_dict.get('level'), str) else 'info'
            namespace = event_dict.pop('namespace', 'backend')
            
            message = event_dict.pop('event', str(event_dict))
            
            # Create log entry
            SystemLog.log(
                level=level,
                service=namespace,
                message=message,
                metadata=event_dict
            )
            
            # Cleanup periodically
            if SystemLog.objects.count() % 100 == 0:
                SystemLog.cleanup_old_logs(keep_count=10)
                
        except Exception:
            pass
        
        return event_dict
    
    @staticmethod
    def _table_exists(table_name):
        """Check if a table exists in the database"""
        try:
            cursor = connection.cursor()
            cursor.execute(f"SELECT 1 FROM information_schema.tables WHERE table_name = '{table_name}'")
            return cursor.fetchone() is not None
        except:
            return False
