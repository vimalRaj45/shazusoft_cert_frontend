import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
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
