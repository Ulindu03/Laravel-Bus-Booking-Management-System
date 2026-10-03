import api from './axios';

const BUS_ENDPOINT = '/admin/buses';

const busService = {
  /**
   * Fetch all buses
   * @returns {Promise} List of all buses
   */
  getAllBuses: async () => {
    try {
      const response = await api.get(BUS_ENDPOINT);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Fetch a single bus by ID
   * @param {number} id - The bus ID
   * @returns {Promise} Bus data
   */
  getBusById: async (id) => {
    try {
      const response = await api.get(`${BUS_ENDPOINT}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Create a new bus
   * @param {Object} busData - The bus data object
   * @returns {Promise} Created bus data
   */
  createBus: async (busData) => {
    try {
      const response = await api.post(BUS_ENDPOINT, busData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Update an existing bus
   * @param {number} id - The bus ID
   * @param {Object} busData - The updated bus data
   * @returns {Promise} Updated bus data
   */
  updateBus: async (id, busData) => {
    try {
      const response = await api.put(`${BUS_ENDPOINT}/${id}`, busData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Delete a bus
   * @param {number} id - The bus ID
   * @returns {Promise} Deletion response
   */
  deleteBus: async (id) => {
    try {
      const response = await api.delete(`${BUS_ENDPOINT}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default busService;
