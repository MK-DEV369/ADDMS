"""
URL configuration for ADDMS project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
    openapi.Info(
        title="ADDMS API",
        default_version='v3',
        description="Autonomous Drone Delivery Management System API",
        terms_of_service="https://www.Moryakantha.com/terms/",
        contact=openapi.Contact(email="lmkantha@gmail.com"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    path('api/auth/', include('apps.users.urls')),
    path('api/drones/', include('apps.drones.urls')),
    path('api/deliveries/', include('apps.deliveries.urls')),
    path('api/zones/', include('apps.zones.urls')),
    path('api/routes/', include('apps.routes.urls')),
    path('api/telemetry/', include('apps.telemetry.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

