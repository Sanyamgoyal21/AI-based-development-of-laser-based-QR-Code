# Rail QR System - Chat & Enhanced Vendor Portal Implementation

## Summary
Successfully implemented a comprehensive chat system and enhanced the vendor portal with dashboard, QR scanning with vendor validation, tracking, and chat features.

## Features Implemented

### 1. Backend - Chat System

#### Database Schema (backend/models.js)
- **ChatMessage Model**: Created new schema for storing chat messages
  - Fields: sender, receiver, message, isRead, readAt, timestamps
  - Indexed for performance (sender/receiver queries)

#### Chat Routes (backend/routes_chat.js)
- `GET /api/chat/available-users` - Get users that current user can chat with
  - Vendors can only see admin, superadmin, employee (NOT other vendors)
  - Employees can chat with admin, superadmin, other employees
  - Admin/superadmin can chat with everyone
  
- `GET /api/chat/conversations` - Get list of conversations with unread count
- `GET /api/chat/messages/:userId` - Get messages between current user and another user
  - Automatically marks messages as read
  
- `POST /api/chat/send` - Send a message to another user by username
  - Validates vendor cannot message another vendor
  - Emits real-time socket event to receiver
  
- `GET /api/chat/unread-count` - Get total unread message count
- `GET /api/chat/search-users` - Search users by username/name (with role filtering)

#### App Integration (backend/app.js)
- Registered chat routes: `app.use('/api/chat', chatRoutes)`
- Socket.IO already configured for real-time chat messages

### 2. Frontend - API Integration

#### API Service (frontend/src/services/api.js)
- Added `chatAPI` with all chat endpoints:
  - `getAvailableUsers()`, `getConversations()`, `getMessages(userId)`
  - `sendMessage(receiverUsername, message)`, `getUnreadCount()`
  - `searchUsers(query)`

### 3. Enhanced Vendor Portal (frontend/src/pages/VendorPortal.jsx)

#### Features:
1. **Dashboard Tab**
   - Statistics cards: Total Products, Unread Messages, Active Items
   - Quick action buttons for Add Product and Scan QR

2. **My Products Tab**
   - List of products belonging to the logged-in vendor
   - Filtered by vendor's company name
   - Add new product functionality

3. **Scan QR Tab**
   - Upload QR code image to scan
   - **Vendor Validation**: Only allows scanning QR codes where vendor name matches logged-in vendor
   - Shows error message if vendor tries to scan another vendor's QR
   - Display scanned item details with product image
   - Vendor notes field for adding notes

4. **Tracking Tab**
   - Real-time tracking of all vendor's products
   - Shows location, geotag, status, and last updated time
   - Filtered by vendor company name

5. **Chat Feature**
   - Chat button in header with unread message badge
   - Search users by username to start new conversations
   - Conversation list showing recent chats with unread counts
   - Real-time messaging with admin, superadmin, and employees
   - **Blocked**: Cannot chat with other vendors
   - Socket.IO integration for real-time message updates

### 4. Admin Dashboard Chat (frontend/src/pages/AdminDashboard.jsx)

#### Added Features:
1. **Chat Button**
   - Placed in header next to Logout button
   - Shows unread message count badge

2. **Chat Modal**
   - Two-panel design: Conversations list + Message area
   - Search users by username to start new conversations
   - Real-time message updates via Socket.IO
   - Supports chat with all user roles (admin, superadmin, employee, vendor)
   - Auto-scroll to latest messages
   - Enter key to send messages

3. **Real-time Updates**
   - Socket.IO listener for 'new_message' event
   - Updates unread count automatically
   - Shows new messages in real-time if conversation is open
   - Updates conversation list with latest message

### 5. Access Control Rules

#### Vendor Chat Access:
- ✅ Can chat with: Admin, Superadmin, Employee
- ❌ Cannot chat with: Other Vendors

#### Employee Chat Access:
- ✅ Can chat with: Admin, Superadmin, Other Employees
- ❌ Cannot chat with: Vendors (by default, can be modified if needed)

#### Admin/Superadmin Chat Access:
- ✅ Can chat with: Everyone (Admin, Superadmin, Employee, Vendor)

#### QR Scanning Access Control:
- Vendors can only scan QR codes where the vendor name in the QR matches their company name
- Shows clear error message if attempting to scan another vendor's QR code

## Technical Implementation Details

### Real-time Communication
- Uses Socket.IO for real-time message delivery
- Emits `new_message` event to receiver's user-specific room (`user_${userId}`)
- Frontend listens for events and updates UI automatically

### Security
- All chat endpoints require authentication (`authenticateUser` middleware)
- Role-based access control in backend routes
- Vendor-vendor chat blocking at both frontend and backend levels
- QR scan validation ensures vendors only access their own products

### User Experience
- Unread message badges on chat buttons
- Search functionality to find users by username
- Visual indicators for selected conversations
- Auto-scrolling chat messages
- Loading states for all async operations
- Error messages for invalid operations

## How to Use

### For Vendors:
1. Login to vendor portal
2. Access Dashboard to see overview
3. Use "Scan QR" to scan product QR codes (only your vendor's products)
4. Use "Tracking" to monitor your products
5. Click "Chat" button to message admins/employees
6. Search by username to start new conversations

### For Admin/Superadmin/Employee:
1. Login to admin dashboard
2. Click "💬 Chat" button in header
3. Search users by username or select from conversation list
4. Send messages to any user (including vendors)
5. Receive real-time message notifications

## Database Collections

### ChatMessage Collection
```javascript
{
  _id: ObjectId,
  sender: ObjectId (ref: User),
  receiver: ObjectId (ref: User),
  message: String,
  isRead: Boolean,
  readAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /api/chat/available-users | Get users to chat with | Yes |
| GET | /api/chat/conversations | Get conversation list | Yes |
| GET | /api/chat/messages/:userId | Get messages with user | Yes |
| POST | /api/chat/send | Send a message | Yes |
| GET | /api/chat/unread-count | Get unread count | Yes |
| GET | /api/chat/search-users | Search users | Yes |

## Files Modified/Created

### Backend:
- ✅ `backend/models.js` - Added ChatMessage schema
- ✅ `backend/routes_chat.js` - Created (new file) with all chat routes
- ✅ `backend/app.js` - Registered chat routes

### Frontend:
- ✅ `frontend/src/services/api.js` - Added chatAPI endpoints
- ✅ `frontend/src/pages/VendorPortal.jsx` - Completely redesigned with tabs and chat
- ✅ `frontend/src/pages/AdminDashboard.jsx` - Added chat functionality

## Testing Checklist

- [ ] Vendor can login and see dashboard
- [ ] Vendor can add products
- [ ] Vendor can scan QR codes (only their own)
- [ ] Vendor gets error when scanning other vendor's QR
- [ ] Vendor can view tracking information
- [ ] Vendor can chat with admin/employee
- [ ] Vendor cannot find other vendors in user search
- [ ] Admin can chat with vendors
- [ ] Admin can chat with employees
- [ ] Real-time messages work (no page refresh needed)
- [ ] Unread count updates correctly
- [ ] Search users functionality works
- [ ] Enter key sends messages
- [ ] Chat auto-scrolls to bottom

## Notes

1. **Socket.IO Connection**: Ensure Socket.IO server is running and frontend is connected
2. **Vendor Company Name**: Must be set in user's `vendorInfo.companyName` field
3. **QR Code Format**: QR codes must contain vendor name to enable validation
4. **Message Persistence**: All messages are stored in MongoDB ChatMessage collection

## Future Enhancements (Optional)

- [ ] Message attachments (images, files)
- [ ] Group chat functionality
- [ ] Message reactions/emojis
- [ ] Typing indicators
- [ ] Message search within conversations
- [ ] Push notifications for mobile
- [ ] Message deletion/editing
- [ ] Conversation archiving

