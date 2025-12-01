"""
Django settings for ADDMS project.
"""
import os
import structlog
from pathlib import Path
from datetime import timedelta
import environ

# Build paths inside the project
BASE_DIR = Path(__file__).resolve().parent.parent

# Environment variables
env = environ.Env(
    DEBUG=(bool, False),
    POSTGIS_ENABLED=(bool, True),
)

environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = env('SECRET_KEY', default='django-insecure-change-me-in-production-addms-2024')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = env('DEBUG', default=True)

ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['localhost', '127.0.0.1'])

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Django extensions
    'django.contrib.gis',  # PostGIS support
    
    # Third-party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'channels',
    'auditlog',
    'django_filters',
    'drf_yasg',
    'django_celery_beat',
    'django_celery_results',
    'django_prometheus',
    
    # Local apps
    'apps.users',
    'apps.drones',
    'apps.deliveries',
    'apps.zones',
    'apps.routes',
    'apps.telemetry',
    'apps.analytics',
    'apps.notifications',
]

MIDDLEWARE = [
    'django_prometheus.middleware.PrometheusBeforeMiddleware',
    'log_request_id.middleware.RequestIDMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django_prometheus.middleware.PrometheusAfterMiddleware',
]

ROOT_URLCONF = 'addms.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'addms.wsgi.application'
ASGI_APPLICATION = 'addms.asgi.application'

# GDAL and GEOS Configuration (for Windows)
# Note: Logger is defined later, so we'll use print for debugging if needed
if os.name == 'nt':  # Windows
    # Try to find GDAL and GEOS libraries automatically
    import sys
    import glob
    
    # Common conda installation paths
    conda_lib_path = os.path.join(sys.prefix, 'Library', 'bin')
    conda_bin_path = os.path.join(sys.prefix, 'bin')
    
    # GDAL Configuration
    gdal_library_path = None
    
    # Try to find any gdal*.dll file in conda paths
    for search_path in [conda_lib_path, conda_bin_path]:
        if os.path.exists(search_path):
            # Look for gdal*.dll files
            gdal_dlls = glob.glob(os.path.join(search_path, 'gdal*.dll'))
            if gdal_dlls:
                # Prefer versioned DLLs (gdal306.dll) over generic (gdal.dll)
                versioned = [dll for dll in gdal_dlls if any(v in dll for v in ['306', '305', '304', '303', '302', '301', '300'])]
                if versioned:
                    gdal_library_path = versioned[0]
                else:
                    gdal_library_path = gdal_dlls[0]
                break
    
    # If still not found, try specific versioned paths
    if not gdal_library_path:
        gdal_paths = [
            os.path.join(conda_lib_path, 'gdal306.dll'),
            os.path.join(conda_lib_path, 'gdal305.dll'),
            os.path.join(conda_lib_path, 'gdal304.dll'),
            os.path.join(conda_lib_path, 'gdal303.dll'),
            os.path.join(conda_lib_path, 'gdal.dll'),
            os.path.join(conda_bin_path, 'gdal306.dll'),
            os.path.join(conda_bin_path, 'gdal305.dll'),
            os.path.join(conda_bin_path, 'gdal.dll')
        ]
        
        for path in gdal_paths:
            if os.path.exists(path):
                gdal_library_path = path
                break
    
    # If found, set it
    if gdal_library_path:
        GDAL_LIBRARY_PATH = gdal_library_path
    else:
        # If not found, try to get from environment variable
        GDAL_LIBRARY_PATH = env('GDAL_LIBRARY_PATH', default=None)
        if not GDAL_LIBRARY_PATH:
            # Default to conda path with gdal.dll (common for conda installations)
            default_path = os.path.join(sys.prefix, 'Library', 'bin', 'gdal.dll')
            if os.path.exists(default_path):
                GDAL_LIBRARY_PATH = default_path
    
    # GEOS Configuration
    geos_library_path = None
    
    # Try to find GEOS DLL files
    for search_path in [conda_lib_path, conda_bin_path]:
        if os.path.exists(search_path):
            # Look for geos*.dll files
            geos_dlls = glob.glob(os.path.join(search_path, 'geos*.dll'))
            if geos_dlls:
                # Prefer geos_c.dll (most common)
                geos_c = [dll for dll in geos_dlls if 'geos_c' in dll.lower()]
                if geos_c:
                    geos_library_path = geos_c[0]
                else:
                    geos_library_path = geos_dlls[0]
                break
    
    # If still not found, try specific paths
    if not geos_library_path:
        geos_paths = [
            os.path.join(conda_lib_path, 'geos_c.dll'),
            os.path.join(conda_lib_path, 'libgeos_c-1.dll'),
            os.path.join(conda_lib_path, 'geos.dll'),
            os.path.join(conda_bin_path, 'geos_c.dll'),
            os.path.join(conda_bin_path, 'libgeos_c-1.dll'),
        ]
        
        for path in geos_paths:
            if os.path.exists(path):
                geos_library_path = path
                break
    
    # If found, set it
    if geos_library_path:
        GEOS_LIBRARY_PATH = geos_library_path
    else:
        # If not found, try to get from environment variable
        GEOS_LIBRARY_PATH = env('GEOS_LIBRARY_PATH', default=None)
        if not GEOS_LIBRARY_PATH:
            # Default to conda path
            default_geos_path = os.path.join(sys.prefix, 'Library', 'bin', 'geos_c.dll')
            if os.path.exists(default_geos_path):
                GEOS_LIBRARY_PATH = default_geos_path

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': env('DB_NAME', default='addms'),
        'USER': env('DB_USER', default='addms_user'),
        'PASSWORD': env('DB_PASSWORD', default='addms_pass'),
        'HOST': env('DB_HOST', default='localhost'),
        'PORT': env('DB_PORT', default='5433'),
        'OPTIONS': {
            'options': '-c search_path=public'
        },
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom User Model
AUTH_USER_MODEL = 'users.User'

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
}

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# CORS Settings
CORS_ALLOWED_ORIGINS = env.list(
    'CORS_ALLOWED_ORIGINS',
    default=['http://localhost:3000', 'http://127.0.0.1:3000']
)
CORS_ALLOW_CREDENTIALS = True

# Redis Configuration
REDIS_URL = env('REDIS_URL', default='redis://localhost:6379/0')
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': REDIS_URL,
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# Celery Configuration
CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = 'django-db'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE
CELERY_BEAT_SCHEDULER = 'django_celery_beat.schedulers:DatabaseScheduler'

# Celery Beat Schedule (periodic tasks)
CELERY_BEAT_SCHEDULE = {
    'update-fleet-analytics': {
        'task': 'apps.analytics.tasks.update_fleet_metrics',
        'schedule': 900.0,  # Every 15 minutes
    },
    'fetch-weather-updates': {
        'task': 'apps.zones.tasks.fetch_weather_updates',
        'schedule': 3600.0,  # Every hour
    },
}

# Channels Configuration (WebSockets)
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [(env('REDIS_HOST', default='localhost'), 6379)],
        },
    },
}

# Structured Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'json': {
            '()': structlog.stdlib.ProcessorFormatter,
            'processor': structlog.dev.ConsoleRenderer(),
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'json',
        },
    },
    'loggers': {
        '': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'addms': {
            'handlers': ['console'],
            'level': 'DEBUG' if DEBUG else 'INFO',
            'propagate': False,
        },
    },
}

structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

# Audit Log
AUDITLOG_INCLUDE_ALL_MODELS = False

# Request ID
LOG_REQUEST_ID_HEADER = "HTTP_X_REQUEST_ID"
GENERATE_REQUEST_ID_IF_NOT_IN_HEADER = True

logger = structlog.get_logger(__name__)
logger.info("Django settings loaded", namespace="settings", debug=DEBUG)

# Log GDAL configuration if on Windows
if os.name == 'nt' and 'GDAL_LIBRARY_PATH' in globals():
    if GDAL_LIBRARY_PATH:
        logger.info(
            "GDAL library configured",
            namespace="settings",
            gdal_path=GDAL_LIBRARY_PATH
        )
    else:
        logger.warning(
            "GDAL library path not set. PostGIS features may not work.",
            namespace="settings"
        )

