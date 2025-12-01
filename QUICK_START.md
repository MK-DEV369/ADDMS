# ADDMS Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Prerequisites Check
```bash
python --version  # Should be 3.11+
node --version    # Should be 18+
psql --version    # PostgreSQL 14+
redis-cli ping    # Should return PONG
```

### Step 1: Start Database & Redis

**Option A: Docker (Recommended)**
```bash
docker-compose up -d
```

**Option B: Manual**
- Start PostgreSQL with PostGIS
- Start Redis server

### Step 2: Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (copy from .env.example)
# Edit with your database credentials

# Setup database
createdb addms  # Or use pgAdmin
psql addms -c "CREATE EXTENSION postgis;"
psql addms -c "CREATE EXTENSION timescaledb;"  # If available

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

### Step 3: Start Backend Services

**Terminal 1: Django Server**
```bash
cd backend
source venv/bin/activate
python manage.py runserver
```

**Terminal 2: Celery Worker**
```bash
cd backend
source venv/bin/activate
celery -A addms worker -l info
```

**Terminal 3: Celery Beat**
```bash
cd backend
source venv/bin/activate
celery -A addms beat -l info
```

### Step 4: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

### Step 5: Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000/api/
- **Admin Panel:** http://localhost:8000/admin/
- **API Docs:** http://localhost:8000/swagger/

### Step 6: Create Test Users

Login to Django admin or use shell:

```python
python manage.py shell

from apps.users.models import User
User.objects.create_user(username='admin', password='admin', role='admin', email='admin@test.com')
User.objects.create_user(username='manager', password='manager', role='manager', email='manager@test.com')
User.objects.create_user(username='customer', password='customer', role='customer', email='customer@test.com')
```

## 🔍 Verify Installation

1. **Check Backend:**
   - Visit http://localhost:8000/api/auth/ - Should see auth endpoints
   - Visit http://localhost:8000/admin/ - Login with superuser

2. **Check Frontend:**
   - Visit http://localhost:3000
   - Login with test user credentials
   - Should see dashboard placeholder

3. **Check Celery:**
   - Look for "celery@..." in worker terminal
   - Should see "Connected to redis://..."

4. **Check WebSocket:**
   - Open browser console
   - Should connect to ws://localhost:8000/ws/tracking/

## 🐛 Troubleshooting

### PostgreSQL Issues
```sql
-- Check PostGIS extension
SELECT PostGIS_Version();

-- If missing:
CREATE EXTENSION postgis;
```

### Redis Connection Error
```bash
# Check Redis is running
redis-cli ping

# Should return: PONG
```

### Celery Not Starting
- Ensure Redis is running
- Check REDIS_URL in settings.py
- Verify Celery app in celery.py

### Frontend Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📝 Next Steps

1. **Create Test Data:**
   - Add drones via admin panel
   - Create operational zones
   - Add no-fly zones

2. **Implement Placeholders:**
   - See IMPLEMENTATION_NOTES.md for TODO list
   - Start with CesiumJS map component
   - Add WebSocket real-time updates

3. **Customize:**
   - Update branding/colors
   - Configure email settings
   - Set up production environment

## 📚 Documentation

- **Full Setup:** See SETUP.md
- **Project Structure:** See PROJECT_STRUCTURE.md
- **Implementation Notes:** See IMPLEMENTATION_NOTES.md
- **Main README:** See README.md

## ✅ Success Checklist

- [ ] PostgreSQL running with PostGIS
- [ ] Redis running
- [ ] Django server running
- [ ] Celery worker running
- [ ] Celery beat running
- [ ] Frontend dev server running
- [ ] Can login to admin panel
- [ ] Can login to frontend
- [ ] WebSocket connection established

## 🎉 You're Ready!

The prototype is set up. Now you can:
- Explore the codebase
- Implement the placeholder components
- Add your own features
- Customize the UI

Happy coding! 🚁

