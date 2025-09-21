@echo off
echo 🗄️  MongoDB Setup Guide...

echo.
echo 📋 Choose your MongoDB setup option:
echo.
echo 1. Install MongoDB Community Server (Local)
echo 2. Use MongoDB Atlas (Cloud - Recommended for beginners)
echo 3. Skip (Already have MongoDB)
echo.

set /p choice="Enter your choice (1, 2, or 3): "

if "%choice%"=="1" goto local
if "%choice%"=="2" goto atlas
if "%choice%"=="3" goto skip
goto invalid

:local
echo.
echo 📥 Installing MongoDB Community Server...
echo.
echo 1. Go to: https://www.mongodb.com/try/download/community
echo 2. Download MongoDB Community Server for Windows
echo 3. Run the installer
echo 4. Choose "Complete" installation
echo 5. Check "Install MongoDB as a Service"
echo 6. Check "Install MongoDB Compass"
echo.
echo After installation, run: net start MongoDB
echo.
goto end

:atlas
echo.
echo ☁️  Setting up MongoDB Atlas (Cloud)...
echo.
echo 1. Go to: https://www.mongodb.com/atlas
echo 2. Create a free account
echo 3. Create a new cluster (free tier)
echo 4. Create a database user
echo 5. Get your connection string
echo 6. Update backend/config.env with your connection string
echo.
echo Example connection string:
echo MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/railqr
echo.
goto end

:skip
echo.
echo ✅ Skipping MongoDB setup
echo Make sure MongoDB is running on localhost:27017
echo.
goto end

:invalid
echo.
echo ❌ Invalid choice. Please run the script again.
echo.
goto end

:end
echo.
echo 📚 Next steps:
echo 1. Make sure MongoDB is running
echo 2. Run: setup-local.bat
echo 3. Run: start-local.bat
echo.
pause
