import api from "./api";
import { API_ENDPOINTS } from "../constants/apiEndpoints";

export const getTraining = (id) => api.get(`${API_ENDPOINTS.TRAININGS}/${id}`);

// params: { driverId, status, page, pageSize }
export const searchTrainings = (params) =>
  api.get(API_ENDPOINTS.TRAININGS, { params });

export const createTraining = (payload) => api.post(API_ENDPOINTS.TRAININGS, payload);

export const updateTraining = (id, payload) =>
  api.put(`${API_ENDPOINTS.TRAININGS}/${id}`, payload);

export const deleteTraining = (id) => api.delete(`${API_ENDPOINTS.TRAININGS}/${id}`);
