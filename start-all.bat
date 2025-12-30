@echo off
REM ADDMS Development Environment Startup Script
REM This script starts all required services: Docker, Django, Celery, and Frontend

setlocal enabledelayedexpansion

REM Set the project root directory
set PROJECT_ROOT=%~dp0
cd /d "%PROJECT_ROOT%"

echo.
echo ================================================
echo   ADDMS - Autonomous Drone Delivery System
echo   Development Environment Startup
echo ================================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not installed or not in PATH
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Check if Docker daemon is running
docker ps >nul 2>&1
if errorlevel 1 (
    echo Starting Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    timeout /t 10 /nobreak
)

    echo.
echo [1/5] Starting Docker services (PostgreSQL, Redis)...
echo.
docker-compose up -d

if errorlevel 1 (
    echo ERROR: Failed to start Docker services
    pause
    exit /b 1
)

timeout /t 3 /nobreak

echo.
echo [2/5] Starting Django Backend...
echo.
start "ADDMS Backend" cmd /k "cd /d "%PROJECT_ROOT%backend" && venv\Scripts\activate.bat && python manage.py runserver"

timeout /t 2 /nobreak

echo.
echo [3/5] Starting Celery Worker (solo pool for Windows)...
echo.
start "ADDMS Celery Worker" cmd /k "cd /d "%PROJECT_ROOT%backend" && venv\Scripts\activate.bat && celery -A addms worker --loglevel=info --pool=solo"

timeout /t 2 /nobreak

echo.
echo [4/5] Starting Celery Beat (periodic tasks)...
echo.
start "ADDMS Celery Beat" cmd /k "cd /d "%PROJECT_ROOT%backend" && venv\Scripts\activate.bat && celery -A addms beat --loglevel=info"

timeout /t 2 /nobreak

echo.
echo [5/5] Starting Frontend (Vite dev server)...
echo.
start "ADDMS Frontend" cmd /k "cd /d "%PROJECT_ROOT%frontend" && npm run dev"

timeout /t 2 /nobreak

echo.
echo ================================================
echo   All services started successfully!
echo ================================================
echo.
echo Services running:
echo   - Docker:         PostgreSQL (port 5433), Redis (port 6379)
echo   - Backend:        http://localhost:8000
echo   - Frontend:       http://localhost:5173
echo   - Celery Worker:  Running (solo pool)
echo   - Celery Beat:    Running (periodic tasks)
echo.
echo To stop all services:
echo   1. Close the terminal windows
echo   2. Run: docker-compose down
echo.
echo ================================================
echo.

REM Keep this window open for Docker logs
echo Docker logs (press Ctrl+C to stop):
docker-compose logs -f

endlocal
