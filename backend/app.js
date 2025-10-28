const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config({ path: './config.env' });

// Import database connection
const connectDB = require('./database');

// Import routes
const authRoutes = require('./routes_auth');
const itemRoutes = require('./routes_items');
const chatRoutes = require('./routes_chat');
const publicRoutes = require('./routes_public');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// EARLY CORS handling to satisfy preflight before any other middleware
const FRONTEND_ORIGIN = process.env.BASE_URL || 'http://localhost:5173';
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', FRONTEND_ORIGIN);
  res.header('Vary', 'Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Create directories for file uploads
const uploadsDir = path.join(__dirname, 'uploads');
const productImagesDir = path.join(__dirname, 'product-images');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(productImagesDir)) {
  fs.mkdirSync(productImagesDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'productImage') {
      cb(null, productImagesDir);
    } else {
      cb(null, uploadsDir);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.fieldname === 'productImage') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for product images'), false);
      }
    } else {
      cb(null, true);
    }
  }
});

// Security middleware (allow cross-origin images for QR previews)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.BASE_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Content-Length', 'Content-Disposition']
}));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files with CORS headers
app.use('/static', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.BASE_URL || 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static(path.join(__dirname, 'static')));

app.use('/qrcodes', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.BASE_URL || 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  // Allow cross-origin resource loading for images
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  res.header('Cache-Control', 'public, max-age=31536000');
  next();
}, express.static(path.join(__dirname, 'qrcodes')));

// Make upload middleware available to routes
app.locals.upload = upload;

// Static file serving for product images
app.use('/product-images', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.BASE_URL || 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  res.header('Cache-Control', 'public, max-age=31536000');
  next();
}, express.static(path.join(__dirname, 'product-images')));

// Static file serving for chat uploads
app.use('/uploads/chat', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.BASE_URL || 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  res.header('Cache-Control', 'public, max-age=31536000');
  next();
}, express.static(path.join(__dirname, 'uploads', 'chat')));

// Static file serving for public uploads
app.use('/uploads/public', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.BASE_URL || 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  res.header('Cache-Control', 'public, max-age=31536000');
  next();
}, express.static(path.join(__dirname, 'uploads', 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/users', require('./routes_users'));
app.use('/api/chat', chatRoutes);
app.use('/api/public', publicRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Rail QR Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Rail QR System Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      items: '/api/items'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Create HTTP server
const PORT = process.env.PORT || 8000;
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Store connected users
const connectedUsers = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle user authentication and join room
  socket.on('authenticate', (userData) => {
    const { userId, username, role } = userData;
    connectedUsers.set(socket.id, { userId, username, role, socketId: socket.id });
    
    // Join user-specific room
    socket.join(`user_${userId}`);
    
    // Join role-based rooms
    socket.join(`role_${role}`);
    
    // Join global room for general updates
    socket.join('global');
    
    console.log(`User ${username} (${role}) authenticated and joined rooms`);
    
    // Notify other users about new connection
    socket.to('global').emit('user_connected', {
      userId,
      username,
      role,
      timestamp: new Date()
    });
  });

  // Handle user disconnection
  socket.on('disconnect', () => {
    const userData = connectedUsers.get(socket.id);
    if (userData) {
      console.log(`User ${userData.username} disconnected`);
      
      // Notify other users about disconnection
      socket.to('global').emit('user_disconnected', {
        userId: userData.userId,
        username: userData.username,
        role: userData.role,
        timestamp: new Date()
      });
      
      connectedUsers.delete(socket.id);
    }
  });

  // Handle real-time updates
  socket.on('user_updated', (data) => {
    // Broadcast user update to all connected users
    socket.to('global').emit('user_updated', {
      ...data,
      timestamp: new Date(),
      updatedBy: connectedUsers.get(socket.id)?.username || 'Unknown'
    });
  });

  socket.on('qr_generated', (data) => {
    // Broadcast QR generation to all users
    socket.to('global').emit('qr_generated', {
      ...data,
      timestamp: new Date(),
      generatedBy: connectedUsers.get(socket.id)?.username || 'Unknown'
    });
  });

  socket.on('qr_scanned', (data) => {
    // Broadcast QR scan to all users
    socket.to('global').emit('qr_scanned', {
      ...data,
      timestamp: new Date(),
      scannedBy: connectedUsers.get(socket.id)?.username || 'Unknown'
    });
  });
});

// Make io available to routes
app.set('io', io);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🔌 Socket.IO enabled for real-time updates`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;
