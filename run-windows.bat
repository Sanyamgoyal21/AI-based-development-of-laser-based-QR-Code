@echo off
echo 🚀 Starting Rail QR System...

REM Check if services are already running
docker-compose ps | findstr "Up" >nul
if %errorlevel% equ 0 (
    echo ⚠️  Services are already running. Use 'docker-compose restart' to restart.
    docker-compose ps
    pause
    exit /b 0
)

REM Start services
docker-compose up -d

echo ⏳ Waiting for services to start...
timeout /t 5 /nobreak >nul

REM Check service status
echo 🔍 Service Status:
docker-compose ps

echo.
echo ✅ Services started successfully!
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
