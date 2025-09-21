const express = require('express');
const { Item, QRScanLog, User } = require('./models');
const { verifyAccessToken, extractToken } = require('./auth');
const { itemCreateSchema, itemUpdateSchema, qrScanSchema, validate } = require('./validation');
const { generateUniqueToken, createQRPNGForToken, isValidToken } = require('./utils_qr');
require('dotenv').config({ path: './config.env' });

const router = express.Router();

// Middleware to authenticate user
const authenticateUser = async (req, res, next) => {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// Create new item
router.post('/create', authenticateUser, validate(itemCreateSchema), async (req, res) => {
  try {
    const { 
      itemType, 
      vendor, 
      lotNumber, 
      dateOfSupply, 
      manufactureDate,
      warrantyMonths, 
      warrantyStartDate,
      warrantyEndDate,
      geoLat, 
      geoLng, 
      location,
      geotag,
      qrAccessPassword,
      dynamicData 
    } = req.body;

    // Generate unique token
    const uuidToken = generateUniqueToken();

    // Create item
    const item = new Item({
      uuidToken,
      itemType,
      vendor,
      lotNumber,
      dateOfSupply: dateOfSupply ? new Date(dateOfSupply) : undefined,
      manufactureDate: manufactureDate ? new Date(manufactureDate) : undefined,
      warrantyMonths,
      warrantyStartDate: warrantyStartDate ? new Date(warrantyStartDate) : undefined,
      warrantyEndDate: warrantyEndDate ? new Date(warrantyEndDate) : undefined,
      geoLat,
      geoLng,
      location,
      geotag,
      qrAccessPassword,
      dynamicData: dynamicData || {},
      createdBy: req.user.userId
    });

    await item.save();

    // Generate QR code
    const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
    const qrResult = await createQRPNGForToken(uuidToken, baseUrl);

    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      item: {
        id: item._id,
        uuidToken: item.uuidToken,
        itemType: item.itemType,
        vendor: item.vendor,
        lotNumber: item.lotNumber,
        dateOfSupply: item.dateOfSupply,
        manufactureDate: item.manufactureDate,
        warrantyMonths: item.warrantyMonths,
        warrantyStartDate: item.warrantyStartDate,
        warrantyEndDate: item.warrantyEndDate,
        geoLat: item.geoLat,
        geoLng: item.geoLng,
        location: item.location,
        geotag: item.geotag,
        qrAccessPassword: item.qrAccessPassword,
        dynamicData: item.dynamicData,
        createdAt: item.createdAt
      },
      qrCode: {
        filename: qrResult.filename,
        url: qrResult.url
      }
    });
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get item by token
router.get('/by-token/:token', authenticateUser, async (req, res) => {
  try {
    const { token } = req.params;

    if (!isValidToken(token)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token format'
      });
    }

    const item = await Item.findOne({ uuidToken: token })
      .populate('createdBy', 'username fullName')
      .select('-__v');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      item: {
        id: item._id,
        uuidToken: item.uuidToken,
        itemType: item.itemType,
        vendor: item.vendor,
        lotNumber: item.lotNumber,
        dateOfSupply: item.dateOfSupply,
        warrantyMonths: item.warrantyMonths,
        geoLat: item.geoLat,
        geoLng: item.geoLng,
        dynamicData: item.dynamicData,
        createdBy: item.createdBy,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }
    });
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// List all items (admin only)
router.get('/list', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { itemType: { $regex: search, $options: 'i' } },
          { vendor: { $regex: search, $options: 'i' } },
          { lotNumber: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const items = await Item.find(query)
      .populate('createdBy', 'username fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await Item.countDocuments(query);

    res.json({
      success: true,
      items: items.map(item => ({
        id: item._id,
        uuidToken: item.uuidToken,
        itemType: item.itemType,
        vendor: item.vendor,
        lotNumber: item.lotNumber,
        dateOfSupply: item.dateOfSupply,
        warrantyMonths: item.warrantyMonths,
        geoLat: item.geoLat,
        geoLng: item.geoLng,
        dynamicData: item.dynamicData,
        createdBy: item.createdBy,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('List items error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update item
router.put('/:id', authenticateUser, validate(itemUpdateSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Convert dateOfSupply to Date object if provided
    if (updateData.dateOfSupply) {
      updateData.dateOfSupply = new Date(updateData.dateOfSupply);
    }

    const item = await Item.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'username fullName');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      message: 'Item updated successfully',
      item: {
        id: item._id,
        uuidToken: item.uuidToken,
        itemType: item.itemType,
        vendor: item.vendor,
        lotNumber: item.lotNumber,
        dateOfSupply: item.dateOfSupply,
        warrantyMonths: item.warrantyMonths,
        geoLat: item.geoLat,
        geoLng: item.geoLng,
        dynamicData: item.dynamicData,
        createdBy: item.createdBy,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }
    });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete item
router.delete('/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const item = await Item.findByIdAndDelete(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Scan QR code (log scan event)
router.post('/scan/:token', authenticateUser, validate(qrScanSchema), async (req, res) => {
  try {
    const { token } = req.params;
    const { location } = req.body;

    if (!isValidToken(token)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token format'
      });
    }

    const item = await Item.findOne({ uuidToken: token });
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Create scan log
    const scanLog = new QRScanLog({
      itemId: item._id,
      scannedBy: req.user.userId,
      location
    });

    await scanLog.save();

    res.json({
      success: true,
      message: 'QR code scanned successfully',
      scanLog: {
        id: scanLog._id,
        itemId: scanLog.itemId,
        scannedBy: scanLog.scannedBy,
        location: scanLog.location,
        scannedAt: scanLog.scannedAt
      }
    });
  } catch (error) {
    console.error('Scan QR error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get scan history for an item
router.get('/:id/scans', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const scans = await QRScanLog.find({ itemId: id })
      .populate('scannedBy', 'username fullName')
      .sort({ scannedAt: -1 })
      .select('-__v');

    res.json({
      success: true,
      scans: scans.map(scan => ({
        id: scan._id,
        itemId: scan.itemId,
        scannedBy: scan.scannedBy,
        location: scan.location,
        scannedAt: scan.scannedAt
      }))
    });
  } catch (error) {
    console.error('Get scan history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update maintenance details for dynamic QR
router.post('/:token/maintenance', authenticateUser, async (req, res) => {
  try {
    const { token } = req.params;
    const { maintenanceType, description, status, notes } = req.body;

    if (!isValidToken(token)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token format'
      });
    }

    const item = await Item.findOne({ uuidToken: token });
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Add maintenance record to dynamicData
    const maintenanceRecord = {
      id: Date.now().toString(),
      maintenanceType,
      description,
      status,
      notes,
      performedBy: req.user.userId,
      performedAt: new Date(),
      timestamp: new Date().toISOString()
    };

    // Initialize maintenanceHistory if it doesn't exist
    if (!item.dynamicData.maintenanceHistory) {
      item.dynamicData.maintenanceHistory = [];
    }

    item.dynamicData.maintenanceHistory.push(maintenanceRecord);
    item.dynamicData.lastUpdated = new Date().toISOString();
    item.dynamicData.isDynamic = true;

    await item.save();

    res.json({
      success: true,
      message: 'Maintenance record updated successfully',
      maintenanceRecord,
      item: {
        id: item._id,
        uuidToken: item.uuidToken,
        itemType: item.itemType,
        vendor: item.vendor,
        dynamicData: item.dynamicData
      }
    });
  } catch (error) {
    console.error('Update maintenance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get dynamic QR data (for scanning)
router.get('/dynamic/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!isValidToken(token)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token format'
      });
    }

    const item = await Item.findOne({ uuidToken: token })
      .populate('createdBy', 'username fullName')
      .select('-__v');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      item: {
        id: item._id,
        uuidToken: item.uuidToken,
        itemType: item.itemType,
        vendor: item.vendor,
        lotNumber: item.lotNumber,
        dateOfSupply: item.dateOfSupply,
        warrantyMonths: item.warrantyMonths,
        warrantyStartDate: item.warrantyStartDate,
        warrantyEndDate: item.warrantyEndDate,
        manufactureDate: item.manufactureDate,
        geoLat: item.geoLat,
        geoLng: item.geoLng,
        location: item.location,
        geotag: item.geotag,
        dynamicData: item.dynamicData,
        createdBy: item.createdBy,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }
    });
  } catch (error) {
    console.error('Get dynamic QR error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
