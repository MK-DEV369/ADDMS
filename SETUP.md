# ADDMS Setup Instructions

## Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+ with PostGIS extension
- Redis 7+

## Backend Setup

1. **Create virtual environment:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Set up PostgreSQL database:**
```sql
CREATE DATABASE addms;
CREATE USER addms_user WITH PASSWORD 'addms_pass';
GRANT ALL PRIVILEGES ON DATABASE addms TO addms_user;
\c addms
CREATE EXTENSION postgis;
CREATE EXTENSION timescaledb;
```

4. **Create .env file:**
```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials
```

5. **Run migrations:**
```bash
python manage.py makemigrations
python manage.py migrate
```

6. **Create superuser:**
```bash
python manage.py createsuperuser
```

7. **Start development server:**
```bash
python manage.py runserver
```

## Celery Setup

1. **Start Redis:**
```bash
redis-server
```

2. **Start Celery Worker (in a new terminal):**
```bash
cd backend
source venv/bin/activate
celery -A addms worker -l info
```

3. **Start Celery Beat (in another terminal):**
```bash
cd backend
source venv/bin/activate
celery -A addms beat -l info
```

## Frontend Setup

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **Start development server:**
```bash
npm run dev
```

## Docker Setup (Alternative)

1. **Start PostgreSQL and Redis:**
```bash
docker-compose up -d
```

2. **Follow backend setup steps 2-7 above**

## Access Points

- Django Admin: http://localhost:8000/admin/
- API Root: http://localhost:8000/api/
- API Docs (Swagger): http://localhost:8000/swagger/
- Frontend: http://localhost:3000
- WebSocket: ws://localhost:8000/ws/tracking/

## Debugging Tips

1. **Check PostgreSQL:**
```bash
psql -U addms_user -d addms
SELECT PostGIS_Version();
```

2. **Check Redis:**
```bash
redis-cli ping
```

3. **Check Celery:**
Monitor terminal logs for task execution

4. **Django Debug Toolbar:**
Already configured in DEBUG mode

## Initial Data

Create test users via Django admin or shell:
```python
python manage.py shell
from apps.users.models import User
User.objects.create_user(username='admin', password='admin', role='admin')
User.objects.create_user(username='manager', password='manager', role='manager')
User.objects.create_user(username='customer', password='customer', role='customer')
```

## Troubleshooting

- **PostGIS errors:** Ensure PostGIS extension is installed
- **Redis connection:** Check Redis is running and URL in settings
- **Celery tasks not running:** Check worker and beat processes
- **CORS errors:** Verify CORS_ALLOWED_ORIGINS in settings

