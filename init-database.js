const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/railqr', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: String,
  role: { type: String, enum: ['worker', 'admin'], default: 'worker' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function initDatabase() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    // Check if admin user exists
    const adminExists = await User.findOne({ username: 'admin' });
    
    if (!adminExists) {
      console.log('👤 Creating default users...');
      
      // Create admin user
      const adminHash = await bcrypt.hash('admin123', 12);
      await User.create({
        username: 'admin',
        password: adminHash,
        fullName: 'System Administrator',
        role: 'admin'
      });
      
      // Create worker user
      const workerHash = await bcrypt.hash('worker123', 12);
      await User.create({
        username: 'worker',
        password: workerHash,
        fullName: 'Railway Worker',
        role: 'worker'
      });
      
      console.log('✅ Default users created successfully!');
      console.log('   Admin: username=admin, password=admin123');
      console.log('   Worker: username=worker, password=worker123');
    } else {
      console.log('✅ Database already initialized');
    }
    
    await mongoose.disconnect();
    console.log('🎉 Database setup complete!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

initDatabase();
