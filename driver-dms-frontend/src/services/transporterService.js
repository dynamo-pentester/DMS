import api from "./api";
import { API_ENDPOINTS } from "../constants/apiEndpoints";

export const getTransporter = (id) => api.get(`${API_ENDPOINTS.TRANSPORTERS}/${id}`);

// params: { searchTerm, isActive, page, pageSize }
export const searchTransporters = (params) =>
  api.get(API_ENDPOINTS.TRANSPORTERS, { params });

export const createTransporter = (payload) =>
  api.post(API_ENDPOINTS.TRANSPORTERS, payload);

export const updateTransporter = (id, payload) =>
  api.put(`${API_ENDPOINTS.TRANSPORTERS}/${id}`, payload);

export const deleteTransporter = (id) =>
  api.delete(`${API_ENDPOINTS.TRANSPORTERS}/${id}`);

// AssignDriverRequest: { driverId, assignmentDate }
export const assignDriver = (transporterId, payload) =>
  api.post(`${API_ENDPOINTS.TRANSPORTERS}/${transporterId}/drivers`, payload);

export const unassignDriver = (transporterId, driverId) =>
  api.delete(`${API_ENDPOINTS.TRANSPORTERS}/${transporterId}/drivers/${driverId}`);

export const getAssignmentHistory = (transporterId) =>
  api.get(`${API_ENDPOINTS.TRANSPORTERS}/${transporterId}/drivers`);
