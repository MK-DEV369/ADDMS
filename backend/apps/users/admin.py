from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin interface for User model"""
    list_display = ['username', 'email', 'role', 'is_active', 'date_joined']
    list_filter = ['role', 'is_active', 'is_staff', 'date_joined']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('ADDMS Fields', {'fields': ('role', 'phone_number', 'address')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('ADDMS Fields', {'fields': ('role', 'phone_number', 'address')}),
    )

