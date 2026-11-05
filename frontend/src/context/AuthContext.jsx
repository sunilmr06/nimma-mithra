import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('campuscare_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('campuscare_token');
      const savedUser = localStorage.getItem('campuscare_user');

      if (savedToken && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          setToken(savedToken);
          // Verify with backend
          const res = await authService.getMe();
          if (res?.user) {
            setUser(res.user);
            localStorage.setItem('campuscare_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.error("Auth check failed:", err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    setToken(res.access_token);
    setUser(res.user);
    localStorage.setItem('campuscare_token', res.access_token);
    localStorage.setItem('campuscare_user', JSON.stringify(res.user));
    return res.user;
  };

  const register = async (userData) => {
    const res = await authService.register(userData);
    setToken(res.access_token);
    setUser(res.user);
    localStorage.setItem('campuscare_token', res.access_token);
    localStorage.setItem('campuscare_user', JSON.stringify(res.user));
    return res.user;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
    localStorage.removeItem('campuscare_token');
    localStorage.removeItem('campuscare_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
