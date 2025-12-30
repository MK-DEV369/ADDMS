"""
User models with role-based access control (RBAC)
"""
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _
import structlog

logger = structlog.get_logger(__name__)


class User(AbstractUser):
    """Custom user model with roles"""
    
    class Role(models.TextChoices):
        ADMIN = 'admin', _('Admin')
        MANAGER = 'manager', _('Manager')
        CUSTOMER = 'customer', _('Customer')
    
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CUSTOMER,
        help_text=_('User role determines access level')
    )
    
    phone_number = models.CharField(max_length=10, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user'
        verbose_name = _('User')
        verbose_name_plural = _('Users')
        indexes = [
            models.Index(fields=['role']),
            models.Index(fields=['email']),
        ]
    
    def __str__(self):
        return f"{self.username} ({self.role})"
    
    def is_admin(self):
        return self.role == self.Role.ADMIN
    
    def is_manager(self):
        return self.role == self.Role.MANAGER
    
    def is_customer(self):
        return self.role == self.Role.CUSTOMER
    
    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        logger.info(
            "User saved",
            namespace="users",
            user_id=self.id,
            username=self.username,
            role=self.role,
            is_new=is_new
        )

