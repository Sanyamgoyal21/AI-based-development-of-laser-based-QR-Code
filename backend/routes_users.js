const express = require('express');
const bcrypt = require('bcryptjs');
const { User } = require('./models');
const { authenticateUser, requireAdmin, requireSuperAdmin } = require('./auth');
const router = express.Router();

// Get all users (admin and superadmin only)
router.get('/list', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }).populate('createdBy', 'username fullName');
    res.json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new user (admin and superadmin only)
router.post('/create', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { username, password, fullName, email, phone, role, vendorInfo } = req.body;
    const currentUser = req.user;

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Role restrictions
    if (currentUser.role === 'admin' && role === 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Admin cannot create superadmin users'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = new User({
      username,
      password: hashedPassword,
      fullName,
      email,
      phone,
      role,
      isActive: true,
      createdBy: currentUser.id,
      vendorInfo: role === 'vendor' ? vendorInfo : undefined
    });

    await newUser.save();

    // Return user without password
    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'User created successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update user (admin and superadmin only)
router.put('/update/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, phone, role, isActive, vendorInfo } = req.body;
    const currentUser = req.user;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Role change restrictions
    if (currentUser.role === 'admin' && role && role !== user.role) {
      return res.status(403).json({
        success: false,
        message: 'Admin cannot change user roles'
      });
    }

    // Prevent admin from changing superadmin role
    if (currentUser.role === 'admin' && user.role === 'superadmin' && role && role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Admin cannot change superadmin role'
      });
    }

    // Update fields
    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (role && currentUser.role === 'superadmin') user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;
    if (vendorInfo && user.role === 'vendor') user.vendorInfo = vendorInfo;

    await user.save();

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'User updated successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Change user password
router.put('/change-password/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const currentUser = req.user;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete user (superadmin only)
router.delete('/delete/:id', authenticateUser, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    // Prevent self-deletion
    if (id === currentUser.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user by ID
router.get('/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id, { password: 0 }).populate('createdBy', 'username fullName');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
