// ============================================================
// src/services/api.js
//
// This is the SINGLE FILE that connects React to our Node backend.
// All Axios calls go through here. Think of it as a "translator"
// between your React components and the Express API.
// ============================================================

import axios from 'axios';

// Create an Axios instance with our backend URL as the base
// Any call like api.get('/properties') will hit http://localhost:5050/api/properties
const api = axios.create({
  baseURL: 'http://localhost:5050/api',
  headers: { 'Content-Type': 'application/json' }
});

// -------------------------------------------------------
// INTERCEPTOR — Automatically attach JWT token to every request
// Without this, you'd have to manually add headers everywhere
// -------------------------------------------------------
api.interceptors.request.use((config) => {
  // Get the token stored in localStorage after login
  const token = localStorage.getItem('propease_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// -------------------------------------------------------
// INTERCEPTOR — Handle expired/invalid tokens globally
// -------------------------------------------------------
api.interceptors.response.use(
  (response) => response, // success: just return the response
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid → log out automatically
      localStorage.removeItem('propease_token');
      localStorage.removeItem('propease_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================================
// AUTH ENDPOINTS
// ============================================================
export const authAPI = {
  // POST /api/auth/signup
  signup: (data) => api.post('/auth/signup', data),

  // POST /api/auth/login
  login: (data) => api.post('/auth/login', data),

  // GET /api/auth/me
  getMe: () => api.get('/auth/me'),
};

// ============================================================
// PROPERTY ENDPOINTS
// ============================================================
export const propertyAPI = {
  // GET /api/properties (owner gets own, tenant gets all)
  getAll: () => api.get('/properties'),

  // GET /api/properties/:id
  getOne: (id) => api.get(`/properties/${id}`),

  // POST /api/properties  (owner only)
  create: (data) => api.post('/properties', data),

  // PUT /api/properties/:id  (owner only)
  update: (id, data) => api.put(`/properties/${id}`, data),

  // DELETE /api/properties/:id  (owner only)
  delete: (id) => api.delete(`/properties/${id}`),

  // PUT /api/properties/:id/assign-tenant
  assignTenant: (id, tenantId) => api.put(`/properties/${id}/assign-tenant`, { tenantId }),

  // POST /api/properties/:id/book (legacy mock wrapper if needed)
  bookProperty: (id, data) => api.post(`/properties/${id}/book`, data),
};

// ============================================================
// TENANT ENDPOINTS
// ============================================================
export const tenantAPI = {
  // GET /api/tenants  (owner: their tenants)
  getAll: () => api.get('/tenants'),

  // GET /api/tenants/all-users  (for owner dropdown)
  getAllUsers: () => api.get('/tenants/all-users'),

  // GET /api/tenants/my-home  (tenant: their property)
  getMyHome: () => api.get('/tenants/my-home'),
};

// ============================================================
// PAYMENT ENDPOINTS
// ============================================================
export const paymentAPI = {
  getAll:  ()           => api.get('/payments'),
  create:  (data)       => api.post('/payments', data),
  update:  (id, data)   => api.put(`/payments/${id}`, data),
  delete:  (id)         => api.delete(`/payments/${id}`),
};

// ============================================================
// MAINTENANCE ENDPOINTS
// ============================================================
export const maintenanceAPI = {
  getAll:  ()         => api.get('/maintenance'),
  create:  (data)     => api.post('/maintenance', data),
  update:  (id, data) => api.put(`/maintenance/${id}`, data),
};

// ============================================================
// MESSAGE ENDPOINTS
// ============================================================
export const messageAPI = {
  getConversations: ()           => api.get('/messages/conversations'),
  getMessages:      (userId)     => api.get(`/messages/${userId}`),
  send:             (data)       => api.post('/messages', data),
  getUnreadCount:   ()           => api.get('/messages/unread'),
};

// ============================================================
// REQUEST ENDPOINTS
// ============================================================
export const requestAPI = {
  create:       (data)       => api.post('/requests', data),
  getAll:       ()           => api.get('/requests'),
  updateStatus: (id, data)   => api.put(`/requests/${id}/status`, data),
};

// ============================================================
// AI ASSISTANT ENDPOINTS
// ============================================================
export const aiAPI = {
  chat: (data) => api.post('/ai/chat', data),
};

export default api;
