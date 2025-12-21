# ADDMS Project Structure

## Backend (Django)

```
backend/
├── addms/                    # Main Django project
│   ├── __init__.py
│   ├── settings.py          # Django settings with PostGIS, Redis, Celery
│   ├── urls.py              # Main URL routing
│   ├── wsgi.py
│   ├── asgi.py              # WebSocket support
│   └── celery.py            # Celery configuration
├── apps/
│   ├── users/               # Authentication & RBAC
│   │   ├── models.py        # User model with roles
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── permissions.py
│   ├── drones/              # Drone fleet management
│   │   ├── models.py        # Drone, MaintenanceLog
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── deliveries/          # Delivery orders
│   │   ├── models.py        # DeliveryOrder, Package, OrderStatusHistory
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── tasks.py         # Celery: assign_drone_to_delivery
│   │   └── urls.py
│   ├── zones/               # Operational & no-fly zones (PostGIS)
│   │   ├── models.py        # OperationalZone, NoFlyZone (POLYGON)
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── tasks.py         # Celery: fetch_weather_updates
│   │   └── urls.py
│   ├── routes/              # Route optimization & ETA
│   │   ├── models.py        # Route (LINESTRING), Waypoint (POINT)
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── tasks.py         # Celery: optimize_route_and_predict_eta
│   │   └── ai/
│   │       ├── route_optimizer.py    # AI: Route optimization
│   │       └── eta_predictor.py      # AI: ETA prediction
│   ├── telemetry/           # Real-time drone data
│   │   ├── models.py        # TelemetryData, DroneStatusStream
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── consumers.py     # WebSocket consumers
│   │   ├── routing.py       # WebSocket routing
│   │   ├── tasks.py         # Celery: process_live_telemetry
│   │   └── urls.py
│   ├── analytics/           # Fleet analytics (TimescaleDB)
│   │   ├── models.py        # FleetAnalytics (hypertable)
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── tasks.py         # Celery: update_fleet_metrics
│   │   └── urls.py
│   └── notifications/       # User notifications
│       ├── models.py        # Notification
│       ├── serializers.py
│       ├── views.py
│       ├── tasks.py         # Celery: notify_customer_event
│       └── urls.py
├── manage.py
└── requirements.txt
└── .env
```

## Frontend (React + TypeScript)

```
frontend/
├── src/
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── admin/
│   │   │   └── Analytics.tsx
│   │   │   └── Drones.tsx
│   │   │   └── SystemLogs.tsx
│   │   │   └── Users.tsx
│   │   │   └── Zones.tsx
│   │   ├── manager/
│   │   │   └── Analytics.tsx
│   │   │   └── Deliveries.tsx
│   │   │   └── FleetMonitor.tsx
│   │   │   └── Weather.tsx
│   │   │   └── Zones.tsx
│   │   └── customer/
│   │       └── NewOrders.tsx
│   │       └── MyOrders.tsx #could add more pages, but dont know yet
│   │       └── Tracking.tsx
│   ├── components/
│   │   ├── Map3D.tsx                 # CesiumJS 3D map
│   │   ├── ProtectedRoute.tsx
│   │   └── ui/ toaster.tsx                       # UI components
│   ├── layouts/
│   │   └── DashboardLayout.tsx
│   ├── store/
│   │   └── auth.ts                   # Zustand auth store
│   ├── lib/
│   │   └── api.ts                    # Axios client with auth
│   │   └── types.ts                   # all (maybe) interface types
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
└── .env
└── .env.local
```

## Key Features

### Backend
- ✅ Django REST Framework with JWT authentication
- ✅ PostGIS spatial models (Point, LineString, Polygon)
- ✅ TimescaleDB for time-series data
- ✅ Celery async tasks (route optimization, telemetry, analytics)
- ✅ Django Channels for WebSocket real-time updates
- ✅ AI module for route optimization & ETA prediction
- ✅ Structured logging with correlation IDs
- ✅ RBAC with role-based permissions

### Frontend
- ✅ React 18 + TypeScript
- ✅ Tailwind CSS + Shadcn/UI components
- ✅ CesiumJS 3D map (placeholder)
- ✅ Zustand for state management
- ✅ React Query for data fetching
- ✅ WebSocket client for real-time updates
- ✅ Role-based dashboards

## Database Schema

### Relational Tables
- `user` - Users with roles (admin, manager, customer)
- `drone` - Drone specifications and current status
- `delivery_order` - Delivery orders with lifecycle
- `package` - Package metadata
- `operational_zone` - POLYGON for delivery areas
- `no_fly_zone` - POLYGON for restricted airspace
- `route` - LINESTRING optimized route
- `waypoint` - POINT along route
- `maintenance_log` - Drone maintenance records
- `notification` - User notifications
- `order_status_history` - Order status changes

### Time-Series Tables (TimescaleDB)
- `telemetry_data` - Drone sensor readings (hypertable)
- `drone_status_stream` - Heartbeat & connectivity
- `weather_data` - Cached weather forecasts (hypertable)
- `battery_history` - Battery charge cycles (hypertable)
- `fleet_analytics` - Aggregated KPIs (hypertable)

## API Endpoints

- `/api/auth/` - Authentication (login, register, profile)
- `/api/drones/` - Drone CRUD operations
- `/api/deliveries/` - Delivery order management
- `/api/zones/` - Zone management (operational, no-fly)
- `/api/routes/` - Route information
- `/api/telemetry/` - Telemetry data
- `/api/analytics/` - Fleet analytics
- `/api/notifications/` - User notifications

## WebSocket Endpoints

- `/ws/tracking/` - Real-time drone tracking

## Celery Tasks

- `assign_drone_to_delivery` - Assign drone to order
- `optimize_route_and_predict_eta` - AI route optimization
- `process_live_telemetry` - Process telemetry data
- `fetch_weather_updates` - Update weather cache
- `update_fleet_metrics` - Update analytics (periodic)
- `notify_customer_event` - Send notifications

