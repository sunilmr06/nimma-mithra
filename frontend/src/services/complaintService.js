import api from './api';

export const complaintService = {
  getComplaints: async (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    return api.get(`/complaints?${query.toString()}`);
  },

  getMyComplaints: async () => {
    return api.get('/complaints/my');
  },

  getComplaintById: async (id) => {
    return api.get(`/complaints/${id}`);
  },

  createComplaint: async (formData) => {
    return api.post('/complaints', formData);
  },

  checkDuplicates: async ({ title, description, category_id, room_id }) => {
    return api.post('/complaints/check-duplicates', {
      title,
      description,
      category_id,
      room_id
    });
  },

  supportComplaint: async (id) => {
    return api.post(`/complaints/${id}/support`, {});
  },

  removeSupport: async (id) => {
    return api.delete(`/complaints/${id}/support`);
  },

  getHistory: async (id) => {
    return api.get(`/complaints/${id}/history`);
  },

  getCampusHierarchy: async () => {
    return api.get('/campus/hierarchy');
  },

  // ===== NEW FEATURES =====

  toggleLike: async (id) => {
    return api.post(`/complaints/${id}/like`, {});
  },

  getComments: async (id) => {
    return api.get(`/complaints/${id}/comments`);
  },

  addComment: async (id, commentText) => {
    return api.post(`/complaints/${id}/comments`, { comment_text: commentText });
  },

  submitFeedback: async (id, { rating, comment }) => {
    return api.post(`/complaints/${id}/feedback`, { rating, comment });
  },

  getPublicFeedback: async () => {
    return api.get('/complaints/feedback');
  },

  getPublicFeed: async (tab = 'all', search = '') => {
    const q = new URLSearchParams();
    if (tab) q.append('tab', tab);
    if (search) q.append('search', search);
    return api.get(`/complaints/public-feed?${q.toString()}`);
  },

  getIssueTracker: async () => {
    return api.get('/complaints/tracker');
  }
};
