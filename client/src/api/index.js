import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:5000/api',
});

API.interceptors.request.use((req) => {
    const token = localStorage.getItem('token');
    if (token) req.headers.Authorization = `Bearer ${token}`;
    return req;
});

// Auth
export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);

// Availability
export const fetchAvailability = (id) => API.get(`/availability/${id}`);
export const fetchStats = (id) => API.get(`/availability/stats/${id}`);
export const addAvailability = (data) => API.post('/availability', data);
export const deleteAvailability = (id) => API.delete(`/availability/${id}`);

// Bookings
export const fetchBookings = (id) => API.get(`/bookings/${id}`);
export const fetchAllBookings = (id) => API.get(`/bookings/all/${id}`);
export const createBooking = (data) => API.post('/bookings', data);
export const cancelBooking = (id) => API.delete(`/bookings/${id}`);

export default API;
