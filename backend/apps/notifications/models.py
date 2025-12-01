"""
Notification models
"""
from django.db import models
from django.utils.translation import gettext_lazy as _


class Notification(models.Model):
    """User notification"""
    
    class NotificationType(models.TextChoices):
        DELIVERY_UPDATE = 'delivery_update', _('Delivery Update')
        DRONE_STATUS = 'drone_status', _('Drone Status')
        SYSTEM_ALERT = 'system_alert', _('System Alert')
        MAINTENANCE = 'maintenance', _('Maintenance')
        WEATHER = 'weather', _('Weather Alert')
    
    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    notification_type = models.CharField(max_length=20, choices=NotificationType.choices)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    related_object_id = models.IntegerField(null=True, blank=True)
    related_object_type = models.CharField(max_length=50, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'notification'
        verbose_name = _('Notification')
        verbose_name_plural = _('Notifications')
        indexes = [
            models.Index(fields=['user', 'is_read', 'created_at']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.user.username}"

