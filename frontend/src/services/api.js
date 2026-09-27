import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Attach JWT token to all outgoing requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('autoflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Centralized error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto logout if already on login page
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('autoflow_token');
        localStorage.removeItem('autoflow_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
