import apiClient from './client';

export const fetchEvents = (params = {}) => apiClient.get('/events', { params }).then((r) => r.data);
export const fetchEventFilters = () => apiClient.get('/events/filters').then((r) => r.data);
export const fetchEvent = (id) => apiClient.get(`/events/${id}`).then((r) => r.data);
export const createEvent = (payload) => apiClient.post('/events', payload).then((r) => r.data);
export const updateEvent = (id, payload) => apiClient.put(`/events/${id}`, payload).then((r) => r.data);
export const deleteEvent = (id) => apiClient.delete(`/events/${id}`).then((r) => r.data);
