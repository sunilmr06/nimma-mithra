import api from './api';

export const staffService = {
  getAssignedTasks: async (status = '') => {
    return api.get(`/staff/tasks${status ? `?status=${status}` : ''}`);
  },

  getTaskDetails: async (id) => {
    return api.get(`/staff/tasks/${id}`);
  },

  updateStatus: async (id, status, remarks = '') => {
    return api.patch(`/staff/tasks/${id}/status`, { status, remarks });
  },

  submitResolution: async (id, formData) => {
    return api.post(`/staff/tasks/${id}/resolution`, formData);
  }
};
