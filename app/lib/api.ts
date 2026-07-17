import axios from 'axios';

// Use port 5002 for backend
const API_BASE_URL = 'http://localhost:5002/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`📤 API: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Handle responses
api.interceptors.response.use(
  (response) => {
    console.log(`📥 API: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Error:', error.message);
    if (error.code === 'ERR_NETWORK') {
      console.error('❌ Backend not running on port 5002');
      // Show user-friendly message
      alert('Cannot connect to server. Please make sure the backend is running on port 5002.');
    }
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;