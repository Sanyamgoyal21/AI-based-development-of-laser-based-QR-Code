@echo off
echo 🚀 Setting up Rail QR System on Windows...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

echo ✅ Docker and Docker Compose are installed

REM Create necessary directories
echo 📁 Creating directories...
if not exist "backend\qrcodes" mkdir backend\qrcodes
if not exist "frontend\dist" mkdir frontend\dist

echo 🔧 Building and starting services...
docker-compose up --build -d

echo ⏳ Waiting for services to start...
timeout /t 15 /nobreak >nul

REM Check if services are running
echo 🔍 Checking service status...
docker-compose ps

echo.
echo 🎉 Setup complete!
echo.
echo 📋 Access URLs:
echo    Frontend: http://localhost:5173
echo    Backend API: http://localhost:8000/api
echo    API Health: http://localhost:8000/api/health
echo.
echo 👤 Default Login Credentials:
echo    Admin: username=admin, password=admin123
echo    Worker: username=worker, password=worker123
echo.
echo 📚 Useful Commands:
echo    View logs: docker-compose logs -f
echo    Stop services: docker-compose down
echo    Restart services: docker-compose restart
echo.
pause
