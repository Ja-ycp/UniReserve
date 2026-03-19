import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const { data } = await api.get('/users/me');
      setUser(data);
    } catch (e) {
      // try refresh token flow
      try {
        const { data } = await api.post('/auth/refresh');
        localStorage.setItem('accessToken', data.accessToken);
        const me = await api.get('/users/me');
        setUser(me.data);
      } catch (err) {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{ fetchMe(); },[]);

  const login = async (id, password) => {
    const { data } = await api.post('/auth/login', { id, password });
    localStorage.setItem('accessToken', data.accessToken);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  const value = { user, setUser, login, logout, loading };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
