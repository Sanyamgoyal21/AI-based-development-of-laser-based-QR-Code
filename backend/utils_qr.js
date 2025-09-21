const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: './config.env' });

// Generate unique token
const generateUniqueToken = () => {
  return uuidv4();
};

// Create QR code PNG for token
const createQRPNGForToken = async (token, baseUrl) => {
  try {
    // Ensure qrcodes directory exists
    const qrDir = process.env.QR_CODE_DIR || './qrcodes';
    await fs.mkdir(qrDir, { recursive: true });
    
    // Create URL for QR code
    const url = `${baseUrl}/scan/${token}`;
    
    // Generate QR code options
    const options = {
      type: 'png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    };
    
    // Generate QR code buffer
    const qrBuffer = await QRCode.toBuffer(url, options);
    
    // Save to file
    const filename = `${token}.png`;
    const filepath = path.join(qrDir, filename);
    await fs.writeFile(filepath, qrBuffer);
    
    return {
      filename,
      filepath,
      url
    };
  } catch (error) {
    console.error('Error creating QR code:', error);
    throw new Error('Failed to create QR code');
  }
};

// Generate QR code as data URL
const generateQRDataURL = async (token, baseUrl) => {
  try {
    const url = `${baseUrl}/scan/${token}`;
    const dataURL = await QRCode.toDataURL(url, {
      width: 256,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return dataURL;
  } catch (error) {
    console.error('Error generating QR data URL:', error);
    throw new Error('Failed to generate QR code');
  }
};

// Validate token format
const isValidToken = (token) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(token);
};

module.exports = {
  generateUniqueToken,
  createQRPNGForToken,
  generateQRDataURL,
  isValidToken
};
