import api from './axios';

const ADMIN_ENDPOINT = '/admin';

const adminService = {
  /**
   * Fetch dashboard overview stats
   * @returns {Promise} Dashboard statistics
   */
  getDashboardStats: async () => {
    try {
      const response = await api.get(`${ADMIN_ENDPOINT}/dashboard`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Fetch all bookings for admin
   * @param {Object} params - Query parameters (search, status, page)
   * @returns {Promise} List of bookings
   */
  getBookings: async (params = {}) => {
    try {
      const response = await api.get(`${ADMIN_ENDPOINT}/bookings`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Fetch all users
   * @param {Object} params - Query parameters (search, role)
   * @returns {Promise} List of users
   */
  getUsers: async (params = {}) => {
    try {
      const response = await api.get(`${ADMIN_ENDPOINT}/users`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Update user status or role
   * @param {number} id - User ID
   * @param {Object} data - Updated fields
   * @returns {Promise} Updated user
   */
  updateUser: async (id, data) => {
    try {
      const response = await api.put(`${ADMIN_ENDPOINT}/users/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default adminService;
