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

let pendingRequestsCount = 0;
let wakeupTimer = null;

const notifyWakeup = (isWaking) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('server-waking-up', { detail: { isWaking } }));
  }
};

// Request interceptor to attach JWT token and track cold-start wakeups
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cert_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  pendingRequestsCount++;
  if (!wakeupTimer) {
    wakeupTimer = setTimeout(() => {
      if (pendingRequestsCount > 0) {
        notifyWakeup(true);
      }
    }, 1800);
  }

  return config;
}, (error) => {
  pendingRequestsCount = Math.max(0, pendingRequestsCount - 1);
  if (pendingRequestsCount === 0 && wakeupTimer) {
    clearTimeout(wakeupTimer);
    wakeupTimer = null;
    notifyWakeup(false);
  }
  return Promise.reject(error);
});

// Response interceptor to handle 401s and finish wakeup tracking
api.interceptors.response.use(
  (response) => {
    pendingRequestsCount = Math.max(0, pendingRequestsCount - 1);
    if (pendingRequestsCount === 0 && wakeupTimer) {
      clearTimeout(wakeupTimer);
      wakeupTimer = null;
      notifyWakeup(false);
    }
    return response;
  },
  (error) => {
    pendingRequestsCount = Math.max(0, pendingRequestsCount - 1);
    if (pendingRequestsCount === 0 && wakeupTimer) {
      clearTimeout(wakeupTimer);
      wakeupTimer = null;
      notifyWakeup(false);
    }
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
