import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';
import { useNotification } from './NotificationContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useNotification();

  useEffect(() => {
    const savedUser = localStorage.getItem('autoflow_user');
    const token = localStorage.getItem('autoflow_token');

    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await API.post('/auth/login', { email, password });
      localStorage.setItem('autoflow_token', data.token);
      localStorage.setItem('autoflow_user', JSON.stringify(data));
      setUser(data);
      showToast(`Welcome back, ${data.name}! (${data.role})`, 'success');
      return data;
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed';
      showToast(msg, 'error');
      throw new Error(msg);
    }
  };

  const register = async (name, email, password, phone) => {
    try {
      const { data } = await API.post('/auth/register', { name, email, password, phone, role: 'CUSTOMER' });
      localStorage.setItem('autoflow_token', data.token);
      localStorage.setItem('autoflow_user', JSON.stringify(data));
      setUser(data);
      showToast(`Account registered successfully as Customer!`, 'success');
      return data;
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed';
      showToast(msg, 'error');
      throw new Error(msg);
    }
  };

  const logout = () => {
    localStorage.removeItem('autoflow_token');
    localStorage.removeItem('autoflow_user');
    setUser(null);
    showToast('Logged out successfully', 'info');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
