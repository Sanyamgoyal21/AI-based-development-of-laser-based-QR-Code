import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';
// Derive the origin (without trailing /api) for accessing static assets like /qrcodes
export const API_ORIGIN = API_BASE.replace(/\/?api\/?$/, '');

export function setAuthToken(token) {
  localStorage.setItem('token', token);
}

export function getAuthToken() {
  return localStorage.getItem('token');
}

export function removeAuthToken() {
  localStorage.removeItem('token');
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
  getScanHistory: (id) => api.get(`/items/${id}/scans`)
};
