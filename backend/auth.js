const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './config.env' });

const SECRET_KEY = process.env.SECRET_KEY || 'super-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Hash password
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Verify password
const verifyPassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

// Create JWT token
const createAccessToken = (payload) => {
  return jwt.sign(payload, SECRET_KEY, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'rail-qr-system'
  });
};

// Verify JWT token
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (error) {
    return null;
  }
};

// Extract token from Authorization header
const extractToken = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

module.exports = {
  hashPassword,
  verifyPassword,
  createAccessToken,
  verifyAccessToken,
  extractToken
};
