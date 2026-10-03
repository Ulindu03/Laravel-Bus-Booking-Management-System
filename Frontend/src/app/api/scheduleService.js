import api from './axios';

const SCHEDULE_ENDPOINT = '/admin/schedules';

const scheduleService = {
  /**
   * Fetch all schedules
   * @param {Object} params - Query parameters (status, bus_id, route_id, date_from, date_to)
   * @returns {Promise} List of schedules
   */
  getAllSchedules: async (params = {}) => {
    try {
      const response = await api.get(SCHEDULE_ENDPOINT, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Fetch a single schedule by ID
   * @param {number} id - Schedule ID
   * @returns {Promise} Schedule data
   */
  getScheduleById: async (id) => {
    try {
      const response = await api.get(`${SCHEDULE_ENDPOINT}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Create a new schedule
   * @param {Object} scheduleData - The schedule data
   * @returns {Promise} Created schedule
   */
  createSchedule: async (scheduleData) => {
    try {
      const response = await api.post(SCHEDULE_ENDPOINT, scheduleData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Update an existing schedule
   * @param {number} id - Schedule ID
   * @param {Object} scheduleData - Updated data
   * @returns {Promise} Updated schedule
   */
  updateSchedule: async (id, scheduleData) => {
    try {
      const response = await api.put(`${SCHEDULE_ENDPOINT}/${id}`, scheduleData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Delete a schedule
   * @param {number} id - Schedule ID
   * @returns {Promise} Deletion response
   */
  deleteSchedule: async (id) => {
    try {
      const response = await api.delete(`${SCHEDULE_ENDPOINT}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default scheduleService;
