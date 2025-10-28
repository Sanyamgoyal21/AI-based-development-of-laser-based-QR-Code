const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ChatMessage, User } = require('./models');
const { authenticateUser } = require('./auth');

const router = express.Router();

// Setup multer for chat file uploads
const chatUploadDir = path.join(__dirname, 'uploads', 'chat');
if (!fs.existsSync(chatUploadDir)) {
  fs.mkdirSync(chatUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, chatUploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'chat-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

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
    
    // Get distinct user IDs with whom the current user has exchanged messages
    const distinctUsers = await ChatMessage.aggregate([
      {
        $match: {
          $or: [
            { sender: currentUserId },
            { receiver: currentUserId }
          ]
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', currentUserId] },
              '$receiver',
              '$sender'
            ]
          }
        }
      }
    ]);
    
    // For each user, get the last message and unread count
    const conversations = await Promise.all(
      distinctUsers.map(async (userData) => {
        const otherUserId = userData._id;
        
        // Get the last message between current user and this other user
        const lastMessage = await ChatMessage.findOne({
          $or: [
            { sender: currentUserId, receiver: otherUserId },
            { sender: otherUserId, receiver: currentUserId }
          ]
        })
          .sort({ createdAt: -1 })
          .populate('sender', 'username fullName role')
          .populate('receiver', 'username fullName role');
        
        // Get unread count for messages from this user to current user
        const unreadCount = await ChatMessage.countDocuments({
          sender: otherUserId,
          receiver: currentUserId,
          isRead: false
        });
        
        return {
          userId: otherUserId,
          lastMessage: lastMessage?.message || '',
          lastMessageTime: lastMessage?.createdAt,
          unreadCount: unreadCount,
          lastMessageId: lastMessage?._id
        };
      })
    );
    
    // Populate user details
    const userIds = conversations.map(c => c.userId);
    const users = await User.find({ _id: { $in: userIds } })
      .select('username fullName role email vendorInfo');
    
    const conversationsWithUsers = conversations.map(conv => {
      const user = users.find(u => u._id.toString() === conv.userId.toString());
      return {
        userId: conv.userId,
        username: user?.username,
        fullName: user?.fullName,
        role: user?.role,
        email: user?.email,
        companyName: user?.vendorInfo?.companyName,
        lastMessage: conv.lastMessage,
        lastMessageTime: conv.lastMessageTime,
        unreadCount: conv.unreadCount
      };
    }).sort((a, b) => {
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
    });
    
    res.json({
      success: true,
      conversations: conversationsWithUsers
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
    
    // Check if userId is valid
    if (!userId || userId === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Valid user ID is required'
      });
    }
    
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
      .populate('repliedTo')
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
        messageType: msg.messageType,
        attachments: msg.attachments,
        reactions: msg.reactions,
        isPriority: msg.isPriority,
        repliedTo: msg.repliedTo,
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

// Send a message with optional file attachment
router.post('/send', upload.array('files', 5), authenticateUser, async (req, res) => {
  try {
    const { receiverUsername, message, messageType = 'text', isPriority = false, repliedTo } = req.body;
    
    if (!receiverUsername) {
      return res.status(400).json({
        success: false,
        message: 'Receiver username is required'
      });
    }
    
    // At least one of message or files must be provided
    if (!message && (!req.files || req.files.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Either message text or file attachment is required'
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
    
    // Process attachments if any
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // file.filename from multer already contains just the filename (e.g., 'chat-123.jpg')
        // file.path is the full path (e.g., 'C:/.../uploads/chat/chat-123.jpg')
        attachments.push({
          filename: file.originalname, // Original uploaded filename
          filepath: file.filename,     // Multer-generated filename (e.g., 'chat-123.jpg')
          mimetype: file.mimetype,
          size: file.size
        });
      }
    }
    
    // Determine message type from attachments
    let finalMessageType = messageType;
    if (attachments.length > 0) {
      const mimeType = attachments[0].mimetype;
      if (mimeType.startsWith('image/')) {
        finalMessageType = 'image';
      } else if (mimeType.startsWith('video/')) {
        finalMessageType = 'video';
      } else {
        finalMessageType = 'document';
      }
    }
    
    // Create chat message
    const chatMessageData = {
      sender: req.user._id,
      receiver: receiver._id,
      message: message ? message.trim() : '',
      messageType: finalMessageType,
      attachments: attachments,
      isPriority: isPriority === 'true' || isPriority === true,
      repliedTo: repliedTo || null
    };
    
    const chatMessage = new ChatMessage(chatMessageData);
    await chatMessage.save();
    
    // Populate sender details for response
    await chatMessage.populate('sender', 'username fullName role');
    await chatMessage.populate('repliedTo');
    
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
          messageType: chatMessage.messageType,
          attachments: chatMessage.attachments,
          isPriority: chatMessage.isPriority,
          repliedTo: chatMessage.repliedTo,
          isRead: chatMessage.isRead,
          createdAt: chatMessage.createdAt
        });
        
        // Also notify sender's own socket for local state update
        io.to(`user_${req.user._id}`).emit('message_sent', {
          id: chatMessage._id
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
        messageType: chatMessage.messageType,
        attachments: chatMessage.attachments,
        isPriority: chatMessage.isPriority,
        repliedTo: chatMessage.repliedTo,
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

// Add reaction to a message
router.post('/reaction/:messageId', authenticateUser, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    
    if (!emoji) {
      return res.status(400).json({
        success: false,
        message: 'Emoji is required'
      });
    }
    
    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Remove existing reaction from this user
    message.reactions = message.reactions.filter(r => r.userId.toString() !== req.user._id.toString());
    
    // Add new reaction
    message.reactions.push({
      userId: req.user._id,
      emoji: emoji
    });
    
    await message.save();
    
    res.json({
      success: true,
      reactions: message.reactions
    });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Remove reaction from a message
router.delete('/reaction/:messageId/:emoji', authenticateUser, async (req, res) => {
  try {
    const { messageId, emoji } = req.params;
    
    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Remove reaction
    message.reactions = message.reactions.filter(
      r => !(r.userId.toString() === req.user._id.toString() && r.emoji === emoji)
    );
    
    await message.save();
    
    res.json({
      success: true,
      reactions: message.reactions
    });
  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Note: Chat files are served statically via /uploads/chat in app.js
// This endpoint can be used for additional security/validation if needed

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
