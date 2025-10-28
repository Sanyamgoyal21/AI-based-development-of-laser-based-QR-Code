import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';
// Derive the origin (without trailing /api) for accessing static assets like /qrcodes
export const API_ORIGIN = API_BASE.replace(/\/?api\/?$/, '');

export function setAuthToken(token) {
  localStorage.setItem('token', token);
  // Dispatch custom event to notify App component of auth state change
  window.dispatchEvent(new Event('authStateChange'));
}

export function getAuthToken() {
  return localStorage.getItem('token');
}

export function removeAuthToken() {
  localStorage.removeItem('token');
  // Dispatch custom event to notify App component of auth state change
  window.dispatchEvent(new Event('authStateChange'));
}

export const api = axios.create({ 
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(config => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      removeAuthToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile')
};

export const itemsAPI = {
  create: (itemData) => {
    // Check if itemData is FormData
    if (itemData instanceof FormData) {
      return api.post('/items/create', itemData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    }
    return api.post('/items/create', itemData);
  },
  getByToken: (token) => api.get(`/items/by-token/${token}`),
  list: (params) => api.get('/items/list', { params }),
  update: (id, itemData) => api.put(`/items/${id}`, itemData),
  delete: (id) => api.delete(`/items/${id}`),
  scan: (token, location) => api.post(`/items/scan/${token}`, { location }),
  getScanHistory: (id) => api.get(`/items/${id}/scans`),
  getPDF: (uuidToken) => api.get(`/items/pdf/${uuidToken}`, { responseType: 'blob' })
};

export const usersAPI = {
  list: () => api.get('/users/list'),
  create: (userData) => api.post('/users/create', userData),
  update: (id, userData) => api.put(`/users/update/${id}`, userData),
  delete: (id) => api.delete(`/users/delete/${id}`),
  changePassword: (id, newPassword) => api.put(`/users/change-password/${id}`, { newPassword }),
  getById: (id) => api.get(`/users/${id}`)
};

export const chatAPI = {
  getAvailableUsers: () => api.get('/chat/available-users'),
  getConversations: () => api.get('/chat/conversations'),
  getMessages: (userId) => api.get(`/chat/messages/${userId}`),
  sendMessage: (receiverUsername, message, options = {}) => {
    const { files, messageType, isPriority, repliedTo } = options;
    const formData = new FormData();
    formData.append('receiverUsername', receiverUsername);
    if (message) formData.append('message', message);
    if (messageType) formData.append('messageType', messageType);
    if (isPriority) formData.append('isPriority', isPriority);
    if (repliedTo) formData.append('repliedTo', repliedTo);
    
    if (files && files.length > 0) {
      Array.from(files).forEach((file, index) => {
        formData.append('files', file);
      });
    }
    
    return api.post('/chat/send', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  getUnreadCount: () => api.get('/chat/unread-count'),
  searchUsers: (query) => api.get('/chat/search-users', { params: { query } }),
  addReaction: (messageId, emoji) => api.post(`/chat/reaction/${messageId}`, { emoji }),
  removeReaction: (messageId, emoji) => api.delete(`/chat/reaction/${messageId}/${emoji}`),
  getChatFile: (filename) => {
    const token = getAuthToken();
    return `${API_ORIGIN}/api/chat/file/${filename}?token=${token}`;
  }
};

// Public APIs
export const publicAPI = {
  submitFaultReport: (formData) => api.post('/public/fault-report', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};
