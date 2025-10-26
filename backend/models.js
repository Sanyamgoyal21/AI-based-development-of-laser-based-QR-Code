const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 100
  },
  phone: {
    type: String,
    trim: true,
    maxlength: 20
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'employee', 'vendor'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastLogin: {
    type: Date
  },
  vendorInfo: {
    companyName: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    contactPerson: {
      type: String,
      trim: true
    }
  }
}, {
  timestamps: true
});

// Item Schema
const itemSchema = new mongoose.Schema({
  uuidToken: {
    type: String,
    required: true,
    unique: true
  },
  itemType: {
    type: String,
    required: true,
    trim: true
  },
  vendor: {
    type: String,
    trim: true
  },
  lotNumber: {
    type: String,
    trim: true
  },
  dateOfSupply: {
    type: Date
  },
  manufactureDate: {
    type: Date
  },
  warrantyMonths: {
    type: Number,
    min: 0
  },
  warrantyStartDate: {
    type: Date
  },
  warrantyEndDate: {
    type: Date
  },
  geoLat: {
    type: Number,
    min: -90,
    max: 90
  },
  geoLng: {
    type: Number,
    min: -180,
    max: 180
  },
  location: {
    type: String,
    trim: true
  },
  geotag: {
    type: String,
    trim: true
  },
  qrAccessPassword: {
    type: String,
    trim: true
  },
  productImage: {
    type: String,
    trim: true
  },
  dynamicData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// QR Scan Log Schema
const qrScanLogSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  scannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    type: String,
    trim: true
  },
  scannedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Chat Message Schema
const chatMessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for faster queries
chatMessageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
chatMessageSchema.index({ receiver: 1, isRead: 1 });

// Create models
const User = mongoose.model('User', userSchema);
const Item = mongoose.model('Item', itemSchema);
const QRScanLog = mongoose.model('QRScanLog', qrScanLogSchema);
const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

module.exports = {
  User,
  Item,
  QRScanLog,
  ChatMessage
};
