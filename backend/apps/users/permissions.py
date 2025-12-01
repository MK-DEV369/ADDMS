"""
Role-based permissions for ADDMS
"""
from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """Permission check for Admin role"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_admin()


class IsManager(permissions.BasePermission):
    """Permission check for Manager role"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_manager()


class IsCustomer(permissions.BasePermission):
    """Permission check for Customer role"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_customer()


class IsAdminOrManager(permissions.BasePermission):
    """Permission check for Admin or Manager roles"""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_admin() or request.user.is_manager())
        )

