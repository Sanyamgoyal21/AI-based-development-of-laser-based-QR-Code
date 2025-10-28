import React, { useState, useEffect, useRef } from 'react';
import { itemsAPI, chatAPI, authAPI, removeAuthToken, API_ORIGIN } from '../services/api';
import { useNavigate } from 'react-router-dom';
import QrScanner from 'qr-scanner';
import socketService from '../services/socket';

export default function VendorPortal() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  // Add Product Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    itemType: '',
    lotNumber: '',
    manufactureDate: '',
    warrantyStartDate: '',
    warrantyEndDate: '',
    warrantyMonths: '',
    location: '',
    geotag: '',
    productImage: null
  });
  const [formLoading, setFormLoading] = useState(false);

  // QR Scanner states
  const [scannedItem, setScannedItem] = useState(null);
  const [qrScanLoading, setQrScanLoading] = useState(false);
  const [qrScanError, setQrScanError] = useState('');
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [qualityReport, setQualityReport] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [vendorNotes, setVendorNotes] = useState('');
  const fileInputRef = useRef(null);

  // Chat states
  const [chatOpen, setChatOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const chatFileInputRef = useRef(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);

  // Tracking states
  const [trackingItems, setTrackingItems] = useState([]);
  const [trackingLoading, setTrackingLoading] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
    fetchItems();
    fetchUnreadCount();
    
    // Socket connection
    socketService.connect();
    
    return () => {
      socketService.disconnect();
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      socketService.authenticate(currentUser);
      
      // Listen for new messages
      socketService.on('new_message', handleNewMessage);
    }
    
    return () => {
      socketService.off('new_message', handleNewMessage);
    };
  }, [currentUser]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchCurrentUser = async () => {
    try {
      const response = await authAPI.getProfile();
      if (response.data.success) {
        setCurrentUser(response.data.user);
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await itemsAPI.list({ page: 1, limit: 100 });
      if (response.data.success) {
        // Filter items by vendor name if current user is vendor
        const vendorItems = currentUser?.vendorInfo?.companyName 
          ? response.data.items.filter(item => item.vendor === currentUser.vendorInfo.companyName)
          : response.data.items;
        setItems(vendorItems);
      }
    } catch (err) {
      console.error('Error fetching items:', err);
      setError('Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      
      // Add vendor name from current user
      if (currentUser?.vendorInfo?.companyName) {
        formDataToSend.append('vendorName', currentUser.vendorInfo.companyName);
      }
      
      Object.keys(formData).forEach(key => {
        if (key === 'productImage' && formData[key]) {
          formDataToSend.append(key, formData[key]);
        } else if (formData[key] !== null && formData[key] !== '') {
          formDataToSend.append(key, formData[key]);
        }
      });

      const response = await itemsAPI.create(formDataToSend);
      if (response.data.success) {
        setItems([...items, response.data.item]);
        setShowAddModal(false);
        resetForm();
        alert('Product added successfully!');
      }
    } catch (err) {
      console.error('Error adding product:', err);
      setError(err.response?.data?.message || 'Failed to add product');
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      itemType: '',
      lotNumber: '',
      manufactureDate: '',
      warrantyStartDate: '',
      warrantyEndDate: '',
      warrantyMonths: '',
      location: '',
      geotag: '',
      productImage: null
    });
  };

  // QR Scanner functions
  const processQRCode = async (qrToken) => {
    try {
      setQrScanLoading(true);
      setQrScanError('');
      
      // Fetch item details by QR token
      const response = await itemsAPI.getByToken(qrToken);
      
      if (response.data.success) {
        const item = response.data.item;
        
        // Validate vendor name
        if (currentUser?.vendorInfo?.companyName && item.vendor !== currentUser.vendorInfo.companyName) {
          setQrScanError(`Access denied! This QR code belongs to vendor "${item.vendor}" but you are logged in as "${currentUser.vendorInfo.companyName}".`);
          setScannedItem(null);
          return;
        }
        
        setScannedItem(item);
        setInspectionNotes('');
        setQualityReport('');
        setRecommendations('');
        setVendorNotes('');
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      setQrScanError(error.response?.data?.message || 'Failed to process QR code');
      setScannedItem(null);
    } finally {
      setQrScanLoading(false);
    }
  };

  const handleQRFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setQrScanLoading(true);
      setQrScanError('');
      setScannedItem(null);

      const result = await QrScanner.scanImage(file, { returnDetailedScanResult: true });
      const scannedUrl = result.data;

      const urlMatch = scannedUrl.match(/\/scan\/([a-f0-9-]+)/i);
      if (urlMatch && urlMatch[1]) {
        await processQRCode(urlMatch[1]);
      } else {
        setQrScanError('Invalid QR code format');
      }
    } catch (error) {
      console.error('QR scan error:', error);
      setQrScanError('Failed to scan QR code. Please try again.');
    } finally {
      setQrScanLoading(false);
    }
  };

  const clearQRForm = () => {
    setScannedItem(null);
    setInspectionNotes('');
    setQualityReport('');
    setRecommendations('');
    setVendorNotes('');
    setQrScanError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Chat functions
  const fetchUnreadCount = async () => {
    try {
      const response = await chatAPI.getUnreadCount();
      if (response.data.success) {
        setUnreadCount(response.data.count);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await chatAPI.getConversations();
      if (response.data.success) {
        setConversations(response.data.conversations);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      setChatLoading(true);
      const response = await chatAPI.getMessages(userId);
      if (response.data.success) {
        setMessages(response.data.messages);
        // Refresh conversations to update unread counts
        await fetchConversations();
        await fetchUnreadCount();
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && selectedFiles.length === 0) || !selectedUser) return;

    try {
      const response = await chatAPI.sendMessage(
        selectedUser.username, 
        newMessage, 
        {
          files: selectedFiles,
          repliedTo: replyingTo?.id
        }
      );
      if (response.data.success) {
        setMessages([...messages, response.data.chatMessage]);
        setNewMessage('');
        setSelectedFiles([]);
        setReplyingTo(null);
        fetchUnreadCount();
      }
    } catch (err) {
      console.error('Error sending message:', err);
      alert(err.response?.data?.message || 'Failed to send message');
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles([...selectedFiles, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleUserSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await chatAPI.searchUsers(query);
      if (response.data.success) {
        setSearchResults(response.data.users);
      }
    } catch (err) {
      console.error('Error searching users:', err);
    }
  };

  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    setSearchQuery('');
    setSearchResults([]);
    // conversations use userId, search results use id
    const userId = user.userId || user.id;
    await fetchMessages(userId);
  };

  const handleNewMessage = (data) => {
    console.log('New message received:', data);
    
    // Play beep sound for new message
    playNotificationSound();
    
    // Update unread count
    fetchUnreadCount();
    
    // Always update conversations to show new message preview
    fetchConversations();
    
    // If the message is from the currently selected user, add it to messages
    const selectedUserId = selectedUser?.id || selectedUser?.userId;
    if (selectedUser && data.sender.id === selectedUserId) {
      setMessages(prev => {
        // Check if message already exists to avoid duplicates
        const exists = prev.some(msg => msg.id === data.id);
        if (exists) return prev;
        return [...prev, data];
      });
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const playNotificationSound = () => {
    try {
      // Create a simple beep sound using AudioContext
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // Beep frequency
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
      console.log('Could not play notification sound:', e);
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    navigate('/login');
  };

  const handleChatOpen = async () => {
    setChatOpen(true);
    await fetchConversations();
    // Auto-select the first conversation (most recent)
    if (conversations.length > 0 && !selectedUser) {
      await handleSelectUser(conversations[0]);
    }
  };

  const fetchTrackingItems = async () => {
    try {
      setTrackingLoading(true);
      const response = await itemsAPI.list({ page: 1, limit: 100 });
      if (response.data.success) {
        // Filter items by vendor name
        const vendorItems = currentUser?.vendorInfo?.companyName 
          ? response.data.items.filter(item => item.vendor === currentUser.vendorInfo.companyName)
          : response.data.items;
        setTrackingItems(vendorItems);
      }
    } catch (err) {
      console.error('Error fetching tracking items:', err);
    } finally {
      setTrackingLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'tracking') {
      fetchTrackingItems();
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/railway_sunset_bg_clean.jpg')`,
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-[#ADADAD]/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img 
                src="/ashoka_stambh.png"
                alt="Ashoka Stambh"
                className="h-12 w-12 object-contain mr-4"
              />
              <div>
                <h1 className="text-xl font-display text-white font-bold tracking-tight">
                  TRACK FITTINGS MANAGEMENT SYSTEM
                </h1>
                <p className="text-sm font-condensed text-gray-200">
                  VENDOR PORTAL - {currentUser?.vendorInfo?.companyName || currentUser?.username}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleChatOpen}
                className="relative px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Chat
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <div className="w-64 bg-[#ADADAD]/40 backdrop-blur-sm p-4">
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'dashboard' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white/80 text-gray-800 hover:bg-white'
              }`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'products' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white/80 text-gray-800 hover:bg-white'
              }`}
            >
              📦 My Products
            </button>
            <button
              onClick={() => setActiveTab('scan')}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'scan' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white/80 text-gray-800 hover:bg-white'
              }`}
            >
              📷 Scan QR
            </button>
            <button
              onClick={() => setActiveTab('tracking')}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'tracking' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white/80 text-gray-800 hover:bg-white'
              }`}
            >
              📍 Tracking
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'dashboard' && (
            <div className="bg-[#ADADAD]/40 backdrop-blur-sm rounded-lg p-6 shadow-lg">
              <h2 className="text-2xl font-display font-bold text-white mb-6">Dashboard</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-6 shadow">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Products</h3>
                  <p className="text-3xl font-bold text-blue-600">{items.length}</p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Unread Messages</h3>
                  <p className="text-3xl font-bold text-green-600">{unreadCount}</p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Active Items</h3>
                  <p className="text-3xl font-bold text-purple-600">{items.length}</p>
                </div>
              </div>
              
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors text-left"
                  >
                    <span className="text-2xl">➕</span>
                    <p className="mt-2 font-semibold">Add New Product</p>
                  </button>
                  <button
                    onClick={() => setActiveTab('scan')}
                    className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors text-left"
                  >
                    <span className="text-2xl">📷</span>
                    <p className="mt-2 font-semibold">Scan QR Code</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
        <div className="bg-[#ADADAD]/40 backdrop-blur-sm rounded-lg p-6 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-display font-bold text-white">My Products</h2>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Product
                </button>
              </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-white mt-2">Loading products...</p>
            </div>
              ) : items.length === 0 ? (
            <div className="text-center py-8">
                  <p className="text-white">No products found. Add your first product!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-gray-700 text-gray-200">
                  <tr>
                    <th className="px-6 py-3">Item Type</th>
                    <th className="px-6 py-3">Lot Number</th>
                    <th className="px-6 py-3">Manufacture Date</th>
                    <th className="px-6 py-3">Warranty</th>
                    <th className="px-6 py-3">Location</th>
                    <th className="px-6 py-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                        <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{item.itemType}</td>
                      <td className="px-6 py-4">{item.lotNumber}</td>
                      <td className="px-6 py-4">
                        {item.manufactureDate ? new Date(item.manufactureDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4">
                        {item.warrantyMonths ? `${item.warrantyMonths} months` : '-'}
                      </td>
                      <td className="px-6 py-4">{item.location || '-'}</td>
                      <td className="px-6 py-4">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'scan' && (
            <div className="bg-[#ADADAD]/40 backdrop-blur-sm rounded-lg p-6 shadow-lg">
              <h2 className="text-2xl font-display font-bold text-white mb-6">Scan QR Code</h2>
              
              <div className="bg-white rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Upload QR Code Image</h3>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleQRFileUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                {qrScanLoading && (
                  <div className="mt-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Scanning QR code...</p>
                  </div>
                )}
                {qrScanError && (
                  <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
                    {qrScanError}
                  </div>
                )}
              </div>

              {scannedItem && (
                <div className="bg-white rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Scanned Item Details</h3>
                    <button
                      onClick={clearQRForm}
                      className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      Clear
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-gray-600">Item Type</p>
                      <p className="font-semibold">{scannedItem.itemType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Vendor</p>
                      <p className="font-semibold">{scannedItem.vendor}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Lot Number</p>
                      <p className="font-semibold">{scannedItem.lotNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-semibold">{scannedItem.location || 'N/A'}</p>
                    </div>
                  </div>

                  {scannedItem.productImage && (
                    <div className="mb-6">
                      <p className="text-sm text-gray-600 mb-2">Product Image</p>
                      <img
                        src={`${API_ORIGIN}/product-images/${scannedItem.productImage}`}
                        alt="Product"
                        className="w-48 h-48 object-cover rounded"
                      />
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vendor Notes
                      </label>
                      <textarea
                        value={vendorNotes}
                        onChange={(e) => setVendorNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        rows="4"
                        placeholder="Add your notes about this item..."
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tracking' && (
            <div className="bg-[#ADADAD]/40 backdrop-blur-sm rounded-lg p-6 shadow-lg">
              <h2 className="text-2xl font-display font-bold text-white mb-6">Product Tracking</h2>
              
              {trackingLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-white mt-2">Loading tracking data...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-gray-700 text-gray-200">
                      <tr>
                        <th className="px-6 py-3">Item Type</th>
                        <th className="px-6 py-3">Lot Number</th>
                        <th className="px-6 py-3">Location</th>
                        <th className="px-6 py-3">Geotag</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Last Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trackingItems.map((item) => (
                        <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900">{item.itemType}</td>
                          <td className="px-6 py-4">{item.lotNumber}</td>
                          <td className="px-6 py-4">{item.location || 'Not specified'}</td>
                          <td className="px-6 py-4">{item.geotag || 'N/A'}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                              Active
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add New Product</h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Type *
                  </label>
                  <input
                    type="text"
                    value={formData.itemType}
                    onChange={(e) => setFormData({...formData, itemType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lot Number *
                  </label>
                  <input
                    type="text"
                    value={formData.lotNumber}
                    onChange={(e) => setFormData({...formData, lotNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Manufacture Date
                  </label>
                  <input
                    type="date"
                    value={formData.manufactureDate}
                    onChange={(e) => setFormData({...formData, manufactureDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Warranty Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.warrantyStartDate}
                    onChange={(e) => setFormData({...formData, warrantyStartDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Warranty End Date
                  </label>
                  <input
                    type="date"
                    value={formData.warrantyEndDate}
                    onChange={(e) => setFormData({...formData, warrantyEndDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Warranty (Months)
                  </label>
                  <input
                    type="number"
                    value={formData.warrantyMonths}
                    onChange={(e) => setFormData({...formData, warrantyMonths: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Geo Tag
                  </label>
                  <input
                    type="text"
                    value={formData.geotag}
                    onChange={(e) => setFormData({...formData, geotag: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFormData({...formData, productImage: e.target.files[0]})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {formLoading ? 'Adding...' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {chatOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl h-[600px] flex">
            {/* Left Sidebar - Conversations */}
            <div className="w-1/3 border-r flex flex-col">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold mb-2">Messages</h3>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => handleUserSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                
                {searchResults.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto border rounded">
                    {searchResults.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleSelectUser(user)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                      >
                        <p className="font-semibold">{user.username}</p>
                        <p className="text-xs text-gray-600">{user.fullName} ({user.role})</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {conversations.map((conv) => (
                  <button
                    key={conv.userId}
                    onClick={() => handleSelectUser(conv)}
                    className={`w-full text-left px-4 py-3 border-b hover:bg-gray-50 ${
                      (selectedUser?.id || selectedUser?.userId) === conv.userId ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{conv.username}</p>
                        <p className="text-xs text-gray-600">{conv.fullName}</p>
                        <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Side - Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedUser ? (
                <>
                  <div className="p-4 border-b">
                    <h3 className="font-semibold">{selectedUser.username}</h3>
                    <p className="text-sm text-gray-600">{selectedUser.fullName} ({selectedUser.role})</p>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {chatLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender.id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              msg.sender.id === currentUser?.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-800'
                            }`}
                          >
                            {msg.repliedTo && (
                              <div className="mb-2 p-2 bg-black/10 rounded text-xs border-l-2 border-current">
                                <p className="font-semibold">{msg.repliedTo.sender?.username || 'User'}</p>
                                <p className="truncate">{msg.repliedTo.message}</p>
                              </div>
                            )}
                            
                            {msg.message && <p>{msg.message}</p>}
                            
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {msg.attachments.map((att, idx) => (
                                  <div key={idx}>
                                    {att.mimetype?.startsWith('image/') ? (
                                      <div className="relative">
                                        {(() => {
                                          // Extract just filename from path (handle both old full paths and new filenames)
                                          const getFileUrl = (filepath) => {
                                            if (!filepath) return att.filename;
                                            // If it's a full path, extract just the filename
                                            if (filepath.includes('/') || filepath.includes('\\')) {
                                              return filepath.split(/[/\\]/).pop();
                                            }
                                            return filepath;
                                          };
                                          const fileUrl = getFileUrl(att.filepath);
                                          return (
                                            <>
                                              <a 
                                                href={`http://localhost:8000/uploads/chat/${fileUrl}`}
                                                download={att.filename}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                              >
                                                <img 
                                                  src={`http://localhost:8000/uploads/chat/${fileUrl}`} 
                                                  alt={att.filename}
                                                  className="max-w-xs rounded-lg hover:opacity-90 cursor-pointer"
                                                />
                                              </a>
                                              <span className="text-xs text-gray-300 block mt-1">{att.filename}</span>
                                            </>
                                          );
                                        })()}
                                      </div>
                                    ) : (
                                      <a 
                                        href={`http://localhost:8000/uploads/chat/${att.filepath ? att.filepath.split(/[/\\]/).pop() : att.filename}`}
                                        download={att.filename}
                                        className="flex items-center space-x-2 underline p-2 bg-black/20 rounded"
                                      >
                                        <span>📎 {att.filename}</span>
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {msg.reactions && msg.reactions.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {msg.reactions.map((reaction, idx) => (
                                  <span key={idx} className="bg-black/20 px-2 py-1 rounded text-xs">
                                    {reaction.emoji}
                                  </span>
                                ))}
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs opacity-70">
                                {new Date(msg.createdAt).toLocaleTimeString()}
                              </p>
                              {msg.isPriority && (
                                <span className="text-xs">⭐ Priority</span>
                              )}
                            </div>
                            
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => setShowEmojiPicker(msg.id)}
                                className="text-xs hover:underline"
                              >
                                😊 React
                              </button>
                              <button
                                onClick={() => setReplyingTo(msg)}
                                className="text-xs hover:underline"
                              >
                                ↪️ Reply
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  {replyingTo && (
                    <div className="px-4 py-2 bg-blue-50 border-t border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="font-semibold">Replying to {replyingTo.sender?.username}</span>
                          <p className="text-gray-600 truncate">{replyingTo.message}</p>
                        </div>
                        <button
                          onClick={() => setReplyingTo(null)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {selectedFiles.length > 0 && (
                    <div className="px-4 py-2 bg-gray-100 border-t">
                      <div className="flex flex-wrap gap-2">
                        {selectedFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center space-x-2 bg-white px-2 py-1 rounded border">
                            <span className="text-xs">{file.name}</span>
                            <button
                              onClick={() => removeFile(idx)}
                              className="text-red-500 hover:text-red-700"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="p-4 border-t">
                    <div className="flex space-x-2">
                      <input
                        ref={chatFileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                      />
                      <button
                        onClick={() => chatFileInputRef.current?.click()}
                        className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        📎
                      </button>
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <button
                        onClick={handleSendMessage}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  Select a user to start chatting
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={() => setChatOpen(false)}
            className="absolute top-4 right-4 text-white bg-red-600 rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
