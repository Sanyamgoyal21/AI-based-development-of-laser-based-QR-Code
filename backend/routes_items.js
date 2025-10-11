const express = require('express');
const { Item, QRScanLog, User } = require('./models');
const { verifyAccessToken, extractToken } = require('./auth');
const { itemCreateSchema, itemUpdateSchema, qrScanSchema, validate } = require('./validation');
const { generateUniqueToken, createQRPNGForToken, isValidToken } = require('./utils_qr');
const path = require('path');
const fs = require('fs');
const { jsPDF } = require('jspdf');
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
router.post('/create', authenticateUser, (req, res, next) => {
  // Use multer middleware for file upload
  const upload = req.app.locals.upload;
  upload.single('productImage')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    next();
  });
}, validate(itemCreateSchema), async (req, res) => {
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

    // Handle product image
    let productImagePath = null;
    if (req.file) {
      productImagePath = req.file.filename;
    }

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
      productImage: productImagePath,
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
        manufactureDate: item.manufactureDate,
        warrantyStartDate: item.warrantyStartDate,
        warrantyEndDate: item.warrantyEndDate,
        warrantyMonths: item.warrantyMonths,
        location: item.location,
        geotag: item.geotag,
        geoLat: item.geoLat,
        geoLng: item.geoLng,
        productImage: item.productImage,
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
        location: item.location,
        geotag: item.geotag,
        dynamicData: item.dynamicData,
        createdBy: item.createdBy,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        qrCode: {
          filename: `${item.uuidToken}.png`
        }
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

// Generate PDF for item details
router.get('/pdf/:uuidToken', authenticateUser, async (req, res) => {
  try {
    const { uuidToken } = req.params;
    
    // Find the item
    const item = await Item.findOne({ uuidToken }).populate('createdBy', 'username fullName');
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Create a new PDF document
    const doc = new jsPDF();
    
    // Set up colors
    const primaryColor = [79, 70, 229]; // #4F46E5
    const textColor = [51, 51, 51]; // #333
    const lightGray = [248, 249, 250]; // #f8f9fa
    
    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Details from QR Code', 105, 20, { align: 'center' });
    
    // Reset text color
    doc.setTextColor(...textColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    let yPosition = 50;
    
    // Product Image (if exists)
    if (item.productImage) {
      try {
        const imagePath = path.join(__dirname, 'product-images', item.productImage);
        if (fs.existsSync(imagePath)) {
          const imageBuffer = fs.readFileSync(imagePath);
          const base64Image = imageBuffer.toString('base64');
          
          // Add image (resize to fit)
          doc.addImage(`data:image/jpeg;base64,${base64Image}`, 'JPEG', 15, yPosition, 60, 60);
          yPosition += 70;
        }
      } catch (error) {
        console.error('Error adding product image:', error);
      }
    }
    
    // Product Name (highlighted)
    doc.setFillColor(...lightGray);
    doc.rect(10, yPosition, 190, 15, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Product Name:', 15, yPosition + 10);
    doc.setFont('helvetica', 'normal');
    doc.text(item.itemType, 80, yPosition + 10);
    yPosition += 25;
    
    // Details section
    const details = [
      { label: 'Vendor Name:', value: item.vendor || 'N/A' },
      { label: 'Lot Number:', value: item.lotNumber || 'N/A' },
      { label: 'Manufacture Date:', value: item.manufactureDate ? new Date(item.manufactureDate).toLocaleDateString() : 'N/A' },
      { label: 'Supply Date:', value: item.dateOfSupply ? new Date(item.dateOfSupply).toLocaleDateString() : 'N/A' },
      { label: 'Location (Address):', value: item.location || 'N/A' },
      { label: 'Geotag (Coordinates):', value: item.geotag || 'N/A' },
      { label: 'Warranty Start Date:', value: item.warrantyStartDate ? new Date(item.warrantyStartDate).toLocaleDateString() : 'N/A' },
      { label: 'Warranty End Date:', value: item.warrantyEndDate ? new Date(item.warrantyEndDate).toLocaleDateString() : 'N/A' }
    ];
    
    doc.setFontSize(10);
    details.forEach((detail, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Alternate row colors
      if (index % 2 === 0) {
        doc.setFillColor(...lightGray);
        doc.rect(10, yPosition, 190, 12, 'F');
      }
      
      doc.setFont('helvetica', 'bold');
      doc.text(detail.label, 15, yPosition + 8);
      doc.setFont('helvetica', 'normal');
      doc.text(detail.value, 80, yPosition + 8);
      yPosition += 15;
    });
    
    // Inspection Data Section (if exists)
    if (item.dynamicData) {
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Inspection Notes
      if (item.dynamicData.inspectionNotes) {
        doc.setFillColor(...lightGray);
        doc.rect(10, yPosition, 190, 15, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Inspection Notes:', 15, yPosition + 10);
        yPosition += 20;
        
        // Split long text into multiple lines
        const inspectionText = item.dynamicData.inspectionNotes;
        const maxWidth = 180;
        const lines = doc.splitTextToSize(inspectionText, maxWidth);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        lines.forEach(line => {
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(line, 15, yPosition);
          yPosition += 6;
        });
        yPosition += 10;
      }
      
      // Quality Report
      if (item.dynamicData.qualityReport) {
        if (yPosition > 200) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFillColor(...lightGray);
        doc.rect(10, yPosition, 190, 15, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Quality Report:', 15, yPosition + 10);
        yPosition += 20;
        
        const qualityText = item.dynamicData.qualityReport;
        const qualityLines = doc.splitTextToSize(qualityText, 180);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        qualityLines.forEach(line => {
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(line, 15, yPosition);
          yPosition += 6;
        });
        yPosition += 10;
      }
      
      // Recommendations
      if (item.dynamicData.recommendations) {
        if (yPosition > 200) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFillColor(...lightGray);
        doc.rect(10, yPosition, 190, 15, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Recommendations:', 15, yPosition + 10);
        yPosition += 20;
        
        const recommendationsText = item.dynamicData.recommendations;
        const recommendationsLines = doc.splitTextToSize(recommendationsText, 180);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        recommendationsLines.forEach(line => {
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(line, 15, yPosition);
          yPosition += 6;
        });
        yPosition += 10;
      }
      
      // Vendor Notes
      if (item.dynamicData.vendorNotes) {
        if (yPosition > 200) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFillColor(...lightGray);
        doc.rect(10, yPosition, 190, 15, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Vendor Notes:', 15, yPosition + 10);
        yPosition += 20;
        
        const vendorText = item.dynamicData.vendorNotes;
        const vendorLines = doc.splitTextToSize(vendorText, 180);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        vendorLines.forEach(line => {
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(line, 15, yPosition);
          yPosition += 6;
        });
        yPosition += 10;
      }
      
      // Service Information
      if (item.dynamicData.serviceDate || item.dynamicData.nextInspection) {
        if (yPosition > 200) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFillColor(...lightGray);
        doc.rect(10, yPosition, 190, 15, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Service Information:', 15, yPosition + 10);
        yPosition += 20;
        
        if (item.dynamicData.serviceDate) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.text('Service Date:', 15, yPosition);
          doc.setFont('helvetica', 'normal');
          doc.text(new Date(item.dynamicData.serviceDate).toLocaleString(), 80, yPosition);
          yPosition += 12;
        }
        
        if (item.dynamicData.nextInspection) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.text('Next Inspection:', 15, yPosition);
          doc.setFont('helvetica', 'normal');
          doc.text(new Date(item.dynamicData.nextInspection).toLocaleDateString(), 80, yPosition);
          yPosition += 12;
        }
        
        yPosition += 10;
      }
    }
    
    // QR Code section
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }
    
    try {
      const qrPath = path.join(__dirname, 'qrcodes', `${uuidToken}.png`);
      if (fs.existsSync(qrPath)) {
        const qrBuffer = fs.readFileSync(qrPath);
        const base64QR = qrBuffer.toString('base64');
        
        // Add QR code
        doc.addImage(`data:image/png;base64,${base64QR}`, 'PNG', 15, yPosition, 50, 50);
        
        // QR Code label
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('QR Code', 75, yPosition + 20);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Unique ID: ${uuidToken}`, 75, yPosition + 30);
      }
    } catch (error) {
      console.error('Error adding QR code:', error);
    }
    
    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(102, 102, 102);
      doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 15, 285);
      doc.text('Track Railways Track Fittings Management System', 15, 290);
      doc.text(`Page ${i} of ${pageCount}`, 190, 290, { align: 'right' });
    }
    
    // Set response headers for PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="qr-details-${uuidToken}.pdf"`);
    
    // Send the PDF
    const pdfBuffer = doc.output('arraybuffer');
    res.send(Buffer.from(pdfBuffer));
    
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF'
    });
  }
});

module.exports = router;
