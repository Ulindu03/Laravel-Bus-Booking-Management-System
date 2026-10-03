import axios from './axios';

export const bookingService = {
    // Get schedule details (with cache-busting to always get fresh seat data)
    getSchedule: async (id) => {
        const response = await axios.get(`/schedules/${id}`, {
            params: { _t: Date.now() },
            headers: { 'Cache-Control': 'no-cache' }
        });
        return response.data;
    },

    // Search schedules
    searchSchedules: async (origin, destination, date) => {
        const response = await axios.get('/schedules/search', {
            params: { origin, destination, date }
        });
        return response.data;
    },

    // Create a new booking (supports guest + segment-based booking)
    createBooking: async (scheduleId, seats, boardingStop = null, alightingStop = null, guestEmail = null) => {
        const payload = {
            schedule_id: scheduleId,
            seats: seats,
        };
        if (boardingStop) payload.boarding_stop = boardingStop;
        if (alightingStop) payload.alighting_stop = alightingStop;
        if (guestEmail) payload.guest_email = guestEmail;

        const response = await axios.post('/bookings', payload);
        return response.data;
    },

    // Get all bookings for the logged-in user
    getMyBookings: async () => {
        const response = await axios.get('/bookings');
        return response.data;
    },

    // Get a specific booking by ID
    getBooking: async (id) => {
        const response = await axios.get(`/bookings/${id}`);
        return response.data;
    },

    // Cancel a booking
    cancelBooking: async (id) => {
        const response = await axios.post(`/bookings/${id}/cancel`);
        return response.data;
    }
};
