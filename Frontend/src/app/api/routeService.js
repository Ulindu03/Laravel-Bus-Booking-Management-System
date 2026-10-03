import api from './axios';

const ROUTE_ENDPOINT = '/admin/routes';

const routeService = {
  /**
   * Fetch all routes
   * @param {Object} params - Query parameters (search, status)
   * @returns {Promise} List of routes
   */
  getAllRoutes: async (params = {}) => {
    try {
      const response = await api.get(ROUTE_ENDPOINT, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Fetch a single route by ID
   * @param {number} id - Route ID
   * @returns {Promise} Route data
   */
  getRouteById: async (id) => {
    try {
      const response = await api.get(`${ROUTE_ENDPOINT}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Create a new route
   * @param {Object} routeData - The route data
   * @returns {Promise} Created route
   */
  createRoute: async (routeData) => {
    try {
      const response = await api.post(ROUTE_ENDPOINT, routeData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Update an existing route
   * @param {number} id - Route ID
   * @param {Object} routeData - Updated data
   * @returns {Promise} Updated route
   */
  updateRoute: async (id, routeData) => {
    try {
      const response = await api.put(`${ROUTE_ENDPOINT}/${id}`, routeData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Delete a route
   * @param {number} id - Route ID
   * @returns {Promise} Deletion response
   */
  deleteRoute: async (id) => {
    try {
      const response = await api.delete(`${ROUTE_ENDPOINT}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default routeService;
