@echo off
echo 🛑 Stopping Rail QR System...

REM Stop services
docker-compose down

echo ✅ Services stopped successfully!
echo.
echo 📚 Useful Commands:
echo    Start services: run-windows.bat
echo    Remove all data: docker-compose down -v
echo    View logs: docker-compose logs
echo.
pause
