import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:5000/api',
});

API.interceptors.request.use((req) => {
    const token = localStorage.getItem('token');
    if (token) req.headers.Authorization = `Bearer ${token}`;
    return req;
});

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
export const fetchStats = () => API.get('/availability/stats');
export const fetchFinancials = () => API.get('/availability/financials');

// Bookings
export const fetchBookings = () => API.get('/bookings');
export const fetchAllBookings = () => API.get('/bookings/all');
export const createBooking = (data) => API.post('/bookings', data);
export const requestMeeting = (data) => API.post('/bookings/request', data);
export const approveMeeting = (id) => API.patch(`/bookings/${id}/approve`);
export const declineMeeting = (id, data) => API.patch(`/bookings/${id}/decline`, data);
export const manualBooking = (data) => API.post('/bookings/manual', data);
export const cancelBooking = (id) => API.delete(`/bookings/${id}`);
export const fetchClientBookings = () => API.get('/bookings/client/my-bookings');

// Users
export const toggleAvailability = () => API.patch('/users/availability-toggle');
export const fetchMe = () => API.get('/users/me');
export const updateProfile = (data) => API.patch('/users/profile', data);
export const fetchProfile = (id) => API.get(`/users/${id}/profile`);
export const fetchMyFreelancers = () => API.get('/users/client/my-freelancers');
export const fetchDirectory = () => API.get('/users/directory');

// AI Assistant
export const chatWithAI = (data) => API.post('/ai/chat', data);

export default API;
