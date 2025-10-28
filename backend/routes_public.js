const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { PublicFaultReport } = require('./models');

const router = express.Router();

// Ensure uploads/public exists
const publicUploadsDir = path.join(__dirname, 'uploads', 'public');
if (!fs.existsSync(publicUploadsDir)) {
  fs.mkdirSync(publicUploadsDir, { recursive: true });
}

// Multer storage for public reports
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, publicUploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'fault-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Submit a public fault report
router.post('/fault-report', upload.single('photo'), async (req, res) => {
  try {
    const { faultType, description, locationText, geoLat, geoLng, incidentLocationText, incidentLat, incidentLng, reporterPhone, reporterUserId } = req.body;
    if (!faultType || !description) {
      return res.status(400).json({ success: false, message: 'faultType and description are required' });
    }

    const ipAddress =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      req.ip || '';

    const report = new PublicFaultReport({
      faultType,
      description,
      locationText: locationText || '',
      geoLat: geoLat ? Number(geoLat) : undefined,
      geoLng: geoLng ? Number(geoLng) : undefined,
      incidentLocationText: incidentLocationText || '',
      incidentLat: incidentLat ? Number(incidentLat) : undefined,
      incidentLng: incidentLng ? Number(incidentLng) : undefined,
      ipAddress,
      photoPath: req.file ? req.file.filename : undefined,
      reporterPhone: reporterPhone || '',
      reporterUser: reporterUserId || undefined,
    });

    await report.save();

    res.status(201).json({ success: true, reportId: report._id });
  } catch (err) {
    console.error('Public fault report error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;


