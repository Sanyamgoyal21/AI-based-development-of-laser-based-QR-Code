@echo off
echo 🛑 Stopping Rail QR System...

REM Kill Node.js processes
echo 🔄 Stopping Node.js processes...
taskkill /f /im node.exe >nul 2>&1

echo ✅ Services stopped successfully!
echo.
echo 📚 To start again: run start-local.bat
echo.
pause
