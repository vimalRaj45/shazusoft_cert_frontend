import axios from 'axios';

export const getApiUrl = (path = '') => {
  const base = import.meta.env.VITE_API_URL || '/api';
  const cleanBase = base.replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  if (cleanBase.startsWith('http')) {
    // If path starts with /api, remove it since base already includes /api
    const relative = cleanPath.startsWith('/api') ? cleanPath.substring(4) : cleanPath;
    return `${cleanBase}${relative}`;
  }
  return cleanPath.startsWith('/api') ? cleanPath : `/api${cleanPath}`;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
});

// Request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cert_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to handle 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (!window.location.pathname.startsWith('/verify') && !window.location.pathname.startsWith('/lookup')) {
        localStorage.removeItem('cert_auth_token');
        localStorage.removeItem('cert_auth_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
