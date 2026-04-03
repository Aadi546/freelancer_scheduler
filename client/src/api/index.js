import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:5000/api',
});

API.interceptors.request.use((req) => {
    const token = localStorage.getItem('token');
    if (token) req.headers.Authorization = `Bearer ${token}`;
    return req;
});

// Auto-redirect to login if any request gets a 401 (expired / invalid token)
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.clear();
            window.location.href = '/auth';
        }
        return Promise.reject(error);
    }
);

// Auth
export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);

// Availability
export const fetchAvailability = (id) => API.get(`/availability/${id}`);
export const addAvailability = (data) => API.post('/availability', data);
export const createBulkAvailability = (data) => API.post('/availability/bulk', data);
export const deleteAvailability = (id) => API.delete(`/availability/${id}`);
export const fetchStats = (id) => API.get(`/availability/stats/${id}`);

// Bookings
export const fetchBookings = (id) => API.get(`/bookings/${id}`);
export const fetchAllBookings = (id) => API.get(`/bookings/all/${id}`);
export const createBooking = (data) => API.post('/bookings', data);
export const manualBooking = (data) => API.post('/bookings/manual', data);
export const cancelBooking = (id) => API.delete(`/bookings/${id}`);
export const rejectBooking = (id, data) => API.post(`/bookings/${id}/reject`, data);
export const fetchClientBookings = () => API.get('/bookings/client/my-bookings');

// Users
export const toggleAvailability = () => API.patch('/users/availability-toggle');
export const fetchAvailabilityStatus = (id) => API.get(`/users/${id}/availability-status`);
export const updateProfile = (data) => API.patch('/users/profile', data);
export const fetchProfile = (id) => API.get(`/users/${id}/profile`);
export const fetchMyFreelancers = () => API.get('/users/client/my-freelancers');
export const fetchDirectory = () => API.get('/users/directory');

export default API;
