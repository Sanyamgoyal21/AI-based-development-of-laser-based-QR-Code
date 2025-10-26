const express = require('express');
const { ChatMessage, User } = require('./models');
const { authenticateUser } = require('./auth');

const router = express.Router();

// Get all users that the current user can chat with
router.get('/available-users', authenticateUser, async (req, res) => {
  try {
    const currentUser = req.user;
    
    // Define which roles can chat with each other
    let query = { _id: { $ne: currentUser._id }, isActive: true };
    
    // If user is a vendor, they can only chat with admin, superadmin, and employee
    // NOT with other vendors
    if (currentUser.role === 'vendor') {
      query.role = { $in: ['admin', 'superadmin', 'employee'] };
    } else if (currentUser.role === 'employee') {
      // Employees can chat with everyone except vendors
      query.role = { $in: ['admin', 'superadmin', 'employee'] };
    } else {
      // Admin and superadmin can chat with everyone
      query.role = { $in: ['admin', 'superadmin', 'employee', 'vendor'] };
    }
    
    const users = await User.find(query)
      .select('username fullName role email vendorInfo')
      .sort({ username: 1 });
    
    res.json({
      success: true,
      users: users.map(user => ({
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        email: user.email,
        companyName: user.vendorInfo?.companyName
      }))
    });
  } catch (error) {
    console.error('Get available users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get conversations (list of users with whom the current user has chatted)
router.get('/conversations', authenticateUser, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    
    // Get all unique users with whom the current user has exchanged messages
    const messages = await ChatMessage.aggregate([
      {
        $match: {
          $or: [
            { sender: currentUserId },
            { receiver: currentUserId }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', currentUserId] },
              '$receiver',
              '$sender'
            ]
          },
          lastMessage: { $first: '$message' },
          lastMessageTime: { $first: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiver', currentUserId] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);
    
    // Populate user details
    const userIds = messages.map(m => m._id);
    const users = await User.find({ _id: { $in: userIds } })
      .select('username fullName role email vendorInfo');
    
    const conversations = messages.map(msg => {
      const user = users.find(u => u._id.toString() === msg._id.toString());
      return {
        userId: msg._id,
        username: user?.username,
        fullName: user?.fullName,
        role: user?.role,
        companyName: user?.vendorInfo?.companyName,
        lastMessage: msg.lastMessage,
        lastMessageTime: msg.lastMessageTime,
        unreadCount: msg.unreadCount
      };
    }).sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
    
    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get messages between current user and another user
router.get('/messages/:userId', authenticateUser, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { userId } = req.params;
    
    // Verify the other user exists
    const otherUser = await User.findById(userId).select('username fullName role');
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if current user can chat with this user
    if (req.user.role === 'vendor' && otherUser.role === 'vendor') {
      return res.status(403).json({
        success: false,
        message: 'Vendors cannot chat with other vendors'
      });
    }
    
    // Get all messages between these two users
    const messages = await ChatMessage.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    })
      .populate('sender', 'username fullName role')
      .populate('receiver', 'username fullName role')
      .sort({ createdAt: 1 });
    
    // Mark messages as read
    await ChatMessage.updateMany(
      { sender: userId, receiver: currentUserId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    
    res.json({
      success: true,
      messages: messages.map(msg => ({
        id: msg._id,
        sender: {
          id: msg.sender._id,
          username: msg.sender.username,
          fullName: msg.sender.fullName,
          role: msg.sender.role
        },
        receiver: {
          id: msg.receiver._id,
          username: msg.receiver.username,
          fullName: msg.receiver.fullName,
          role: msg.receiver.role
        },
        message: msg.message,
        isRead: msg.isRead,
        readAt: msg.readAt,
        createdAt: msg.createdAt
      }))
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Send a message
router.post('/send', authenticateUser, async (req, res) => {
  try {
    const { receiverUsername, message } = req.body;
    
    if (!receiverUsername || !message) {
      return res.status(400).json({
        success: false,
        message: 'Receiver username and message are required'
      });
    }
    
    // Find receiver by username
    const receiver = await User.findOne({ username: receiverUsername, isActive: true })
      .select('_id username fullName role');
    
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if sender can chat with receiver
    if (req.user.role === 'vendor' && receiver.role === 'vendor') {
      return res.status(403).json({
        success: false,
        message: 'Vendors cannot chat with other vendors'
      });
    }
    
    // Create chat message
    const chatMessage = new ChatMessage({
      sender: req.user._id,
      receiver: receiver._id,
      message: message.trim()
    });
    
    await chatMessage.save();
    
    // Populate sender details for response
    await chatMessage.populate('sender', 'username fullName role');
    
    // Emit socket event for real-time chat
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${receiver._id}`).emit('new_message', {
          id: chatMessage._id,
          sender: {
            id: req.user._id,
            username: req.user.username,
            fullName: req.user.fullName,
            role: req.user.role
          },
          receiver: {
            id: receiver._id,
            username: receiver.username,
            fullName: receiver.fullName,
            role: receiver.role
          },
          message: chatMessage.message,
          isRead: chatMessage.isRead,
          createdAt: chatMessage.createdAt
        });
      }
    } catch (e) {
      console.error('Socket emit error:', e?.message || e);
    }
    
    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      chatMessage: {
        id: chatMessage._id,
        sender: {
          id: req.user._id,
          username: req.user.username,
          fullName: req.user.fullName,
          role: req.user.role
        },
        receiver: {
          id: receiver._id,
          username: receiver.username,
          fullName: receiver.fullName,
          role: receiver.role
        },
        message: chatMessage.message,
        isRead: chatMessage.isRead,
        createdAt: chatMessage.createdAt
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get unread message count
router.get('/unread-count', authenticateUser, async (req, res) => {
  try {
    const count = await ChatMessage.countDocuments({
      receiver: req.user._id,
      isRead: false
    });
    
    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Search users by username
router.get('/search-users', authenticateUser, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.json({
        success: true,
        users: []
      });
    }
    
    const currentUser = req.user;
    let roleFilter = { $in: ['admin', 'superadmin', 'employee', 'vendor'] };
    
    // Apply role-based filtering
    if (currentUser.role === 'vendor') {
      roleFilter = { $in: ['admin', 'superadmin', 'employee'] };
    } else if (currentUser.role === 'employee') {
      roleFilter = { $in: ['admin', 'superadmin', 'employee'] };
    }
    
    const users = await User.find({
      _id: { $ne: currentUser._id },
      isActive: true,
      role: roleFilter,
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { fullName: { $regex: query, $options: 'i' } }
      ]
    })
      .select('username fullName role email vendorInfo')
      .limit(10)
      .sort({ username: 1 });
    
    res.json({
      success: true,
      users: users.map(user => ({
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        email: user.email,
        companyName: user.vendorInfo?.companyName
      }))
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
