import api from './api';

export const adminService = {
  getAllComplaints: async (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    return api.get(`/admin/complaints?${query.toString()}`);
  },

  acknowledgeComplaint: async (id) => {
    return api.patch(`/admin/complaints/${id}/acknowledge`, {});
  },

  assignStaff: async (id, staffId, remarks = '') => {
    return api.patch(`/admin/complaints/${id}/assign`, {
      staff_id: staffId,
      remarks
    });
  },

  updateSeverity: async (id, severity) => {
    return api.patch(`/admin/complaints/${id}/severity`, { severity });
  },

  reopenComplaint: async (id, remarks = '') => {
    return api.patch(`/admin/complaints/${id}/reopen`, { remarks });
  },

  getStaffList: async () => {
    return api.get('/admin/staff');
  },

  createStaff: async (staffData) => {
    return api.post('/admin/staff', staffData);
  },

  getUsers: async (role = '') => {
    return api.get(`/admin/users${role ? `?role=${role}` : ''}`);
  },

  getAnalyticsSummary: async () => {
    return api.get('/analytics/summary');
  },

  getCategoryDistribution: async () => {
    return api.get('/analytics/categories');
  },

  getStatusDistribution: async () => {
    return api.get('/analytics/status-distribution');
  },

  getTrends: async () => {
    return api.get('/analytics/trends');
  },

  getPriorityDistribution: async () => {
    return api.get('/analytics/priority');
  },

  getStaffPerformance: async () => {
    return api.get('/analytics/staff-performance');
  }
};
