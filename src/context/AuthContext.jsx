import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('cert_auth_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('cert_auth_token');
    if (token) {
      api.get('/auth/me')
        .then((res) => {
          setUser(res.data.user);
          localStorage.setItem('cert_auth_user', JSON.stringify(res.data.user));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      // Ping health endpoint to wake backend up early on initial load
      api.get('/health')
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, []);

  const requestOtp = async (email) => {
    const res = await api.post('/auth/request-otp', { email });
    return res.data;
  };

  const verifyOtp = async (email, otp) => {
    const res = await api.post('/auth/verify-otp', { email, otp });
    const { token, user } = res.data;
    localStorage.setItem('cert_auth_token', token);
    localStorage.setItem('cert_auth_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user } = res.data;
    localStorage.setItem('cert_auth_token', token);
    localStorage.setItem('cert_auth_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('cert_auth_token');
    localStorage.removeItem('cert_auth_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, requestOtp, verifyOtp, login, logout, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
