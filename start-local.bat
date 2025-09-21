@echo off
echo 🚀 Starting Rail QR System (Local)...

REM Check if MongoDB is running
echo 🔍 Checking MongoDB...
mongosh --eval "db.runCommand('ping')" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ MongoDB is not running. Please start MongoDB service.
    echo You can start it from Services.msc or run: net start MongoDB
    pause
    exit /b 1
)

echo ✅ MongoDB is running

REM Start backend in new window
echo 🔧 Starting backend server...
start "Backend Server" cmd /k "cd backend && npm run dev"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in new window
echo 🎨 Starting frontend server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ✅ Services started!
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
echo 📚 To stop services:
echo    Close the command windows or press Ctrl+C in each window
echo.
pause
