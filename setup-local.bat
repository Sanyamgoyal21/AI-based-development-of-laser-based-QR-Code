@echo off
echo 🚀 Setting up Rail QR System (Local Setup)...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js is installed

REM Check if MongoDB is running
echo 🔍 Checking MongoDB connection...
mongosh --eval "db.runCommand('ping')" >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  MongoDB is not running. Please start MongoDB service.
    echo You can start it from Services.msc or run: net start MongoDB
    echo.
    echo Alternative: Use MongoDB Atlas (cloud) and update config.env
    pause
    exit /b 1
)

echo ✅ MongoDB is running

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)

REM Create necessary directories
echo 📁 Creating directories...
cd ..\backend
if not exist "qrcodes" mkdir qrcodes

REM Initialize database
echo 🗄️  Initializing database...
node -e "
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function initDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/railqr');
    console.log('Connected to MongoDB');
    
    const User = mongoose.model('User', new mongoose.Schema({
      username: String,
      password: String,
      fullName: String,
      role: String,
      createdAt: Date,
      updatedAt: Date
    }));
    
    // Check if admin user exists
    const adminExists = await User.findOne({username: 'admin'});
    if (!adminExists) {
      const adminHash = await bcrypt.hash('admin123', 12);
      const workerHash = await bcrypt.hash('worker123', 12);
      
      await User.create({
        username: 'admin',
        password: adminHash,
        fullName: 'System Administrator',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await User.create({
        username: 'worker',
        password: workerHash,
        fullName: 'Railway Worker',
        role: 'worker',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('✅ Default users created');
    } else {
      console.log('✅ Database already initialized');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
}

initDB();
"

if %errorlevel% neq 0 (
    echo ❌ Database initialization failed
    pause
    exit /b 1
)

cd ..

echo.
echo 🎉 Setup complete!
echo.
echo 📋 Next Steps:
echo    1. Start MongoDB service (if not running)
echo    2. Run: start-local.bat
echo.
echo 👤 Default Login Credentials:
echo    Admin: username=admin, password=admin123
echo    Worker: username=worker, password=worker123
echo.
pause
