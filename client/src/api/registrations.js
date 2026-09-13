import apiClient from './client';

export const requestRegistrationOtp = () => apiClient.post('/registrations/otp').then((r) => r.data);
export const registerForEvent = (eventId, otp) => apiClient.post('/registrations', { eventId, otp }).then((r) => r.data);
export const fetchMyRegistrations = () => apiClient.get('/registrations/mine').then((r) => r.data);
export const fetchAllRegistrations = (params = {}) => apiClient.get('/registrations', { params }).then((r) => r.data);
export const fetchAdminStats = () => apiClient.get('/registrations/stats').then((r) => r.data);
export const approveRegistration = (id, feeStatus) => apiClient.put(`/registrations/${id}/approve`, { feeStatus }).then((r) => r.data);
export const cancelRegistration = (id) => apiClient.delete(`/registrations/${id}`).then((r) => r.data);
