# 🚀 Autonomous Drone Delivery Management System (ADDMS)

A modern drone delivery management system built with Django REST Framework, React, CesiumJS, PostGIS, and Redis.

## 🏗️ Architecture Overview

```
ADDMS/
├── backend/           # Django REST API
│   ├── addms/        # Main Django project
│   ├── apps/         # Django applications
│   └── requirements.txt
├── frontend/         # React + TypeScript + CesiumJS
│   ├── src/
│   ├── public/
│   └── package.json
└── docker-compose.yml # Development environment
```

## 🧩 Tech Stack

### Backend
- Django 5.x + Django REST Framework
- PostgreSQL + PostGIS + TimescaleDB
- Redis (Cache + Celery Broker)
- Celery (Async Tasks)
- Django Channels (WebSockets)
- JWT Authentication

### Frontend
- React 18 + TypeScript
- Tailwind CSS
- Shadcn/UI + ReactBits.dev
- CesiumJS (3D Globe)
- Framer Motion
- Recharts

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+ with PostGIS
- Redis 7+

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Redis & Celery

```bash
# Terminal 1: Redis
redis-server

# Terminal 2: Celery Worker
cd backend
celery -A addms worker --loglevel=info --pool=solo
# Terminal 3: Celery Beat (for periodic tasks)
cd backend
celery -A addms beat --loglevel=info
```

## 👥 User Roles

- **Admin**: Full system control
- **Manager**: Fleet management, analytics, maintenance
- **Customer**: Create orders, track deliveries

## 📁 Project Structure

### Backend Apps
- `users` - Authentication & RBAC
- `drones` - Drone fleet management
- `deliveries` - Delivery order lifecycle
- `zones` - Operational & no-fly zones: https://digitalsky.dgca.gov.in/airspace-map/#/app
- `routes` - Route optimization & ETA prediction
- `telemetry` - Real-time drone data
- `analytics` - Fleet metrics & KPIs

### Frontend Features
- 3D CesiumJS map with OSM buildings
- Real-time drone tracking
- Role-based dashboards
- Route visualization
- Analytics charts

## 🔐 Environment Variables

Create `.env` files:

**backend/.env**
```
SECRET_KEY=your-secret-key
DEBUG=True
DATABASE_URL=postgresql://user:pass@localhost/addms
REDIS_URL=redis://localhost:6379/0
POSTGIS_ENABLED=True
```

## 📊 Database

The system uses:
- **PostgreSQL** for relational data
- **PostGIS** for spatial operations
- **TimescaleDB** for time-series telemetry

Run migrations:
```bash
python manage.py migrate
```

## 🧪 AI Module

The route optimization and ETA prediction module is located in:
- `backend/apps/routes/ai/route_optimizer.py`
- `backend/apps/routes/ai/eta_predictor.py`

## 📝 Development Notes

- Add debugging statements throughout for easier troubleshooting
- Placeholder files are created for complex components that can be expanded
- WebSocket endpoints for real-time updates
- Structured logging with correlation IDs

## 🐳 Docker Support

```bash
docker-compose up -d
```

## 📚 API Documentation

Once running, visit:
- Django Admin: http://localhost:8000/admin/
- API Root: http://localhost:8000/api/
- WebSocket: ws://localhost:8000/ws/tracking/

## 🔍 Debugging

- Check Redis: `redis-cli ping`
- Check Celery: Monitor logs in terminal
- Check PostGIS: `SELECT PostGIS_Version();`
- Frontend logs: Browser console
- Backend logs: Django console output

