import api from './api';

export const authService = {
  login: async (email, password) => {
    return api.post('/auth/login', { email, password });
  },

  register: async (userData) => {
    return api.post('/auth/register', userData);
  },

  getMe: async () => {
    return api.get('/auth/me');
  },

  updateProfile: async (formData) => {
    // Can be FormData (with avatar) or JSON
    return api.patch('/auth/profile', formData);
  },

  logout: async () => {
    try {
      await api.post('/auth/logout', {});
    } catch (e) {
      // Ignore network errors on logout
    }
    localStorage.removeItem('campuscare_token');
    localStorage.removeItem('campuscare_user');
  }
};
