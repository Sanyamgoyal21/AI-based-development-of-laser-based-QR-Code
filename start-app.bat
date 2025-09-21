@echo off
echo 🚀 Starting Rail QR System...

echo 🔧 Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm run dev"

echo ⏳ Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo 🎨 Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ✅ Services started!
echo.
echo 📋 Access URLs:
echo    Frontend: http://localhost:5173
echo    Backend API: http://localhost:8000/api
echo.
echo 👤 Login Credentials:
echo    Admin: username=admin, password=admin123
echo    Worker: username=worker, password=worker123
echo.
echo 📚 To stop services: Close the command windows
echo.
pause
