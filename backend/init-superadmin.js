const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('./models');
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/railqr', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const initSuperAdmin = async () => {
  try {
    await connectDB();
    
    // Check if superadmin already exists
    const existingSuperAdmin = await User.findOne({ username: 'admin' });
    
    if (existingSuperAdmin) {
      console.log('Superadmin already exists. Updating role...');
      existingSuperAdmin.role = 'superadmin';
      existingSuperAdmin.fullName = 'System Administrator';
      await existingSuperAdmin.save();
      console.log('Superadmin role updated successfully!');
    } else {
      // Create superadmin
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const superAdmin = new User({
        username: 'admin',
        password: hashedPassword,
        fullName: 'System Administrator',
        email: 'admin@railqr.com',
        role: 'superadmin',
        isActive: true
      });
      
      await superAdmin.save();
      console.log('Superadmin created successfully!');
    }
    
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Role: superadmin');
    
    process.exit(0);
  } catch (error) {
    console.error('Error initializing superadmin:', error);
    process.exit(1);
  }
};

initSuperAdmin();
