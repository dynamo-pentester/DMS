import api from "./api";
import { API_ENDPOINTS } from "../constants/apiEndpoints";

export const getIncident = (id) => api.get(`${API_ENDPOINTS.INCIDENTS}/${id}`);

// params: { driverId, severityLevelId, rootCauseCompleted, page, pageSize }
export const searchIncidents = (params) =>
  api.get(API_ENDPOINTS.INCIDENTS, { params });

export const createIncident = (payload) => api.post(API_ENDPOINTS.INCIDENTS, payload);

export const updateIncident = (id, payload) =>
  api.put(`${API_ENDPOINTS.INCIDENTS}/${id}`, payload);

export const deleteIncident = (id) => api.delete(`${API_ENDPOINTS.INCIDENTS}/${id}`);

// AddCorrectiveActionRequest: { actionTaken, penaltyTypeId, actionDate }
export const addCorrectiveAction = (incidentId, payload) =>
  api.post(`${API_ENDPOINTS.INCIDENTS}/${incidentId}/corrective-actions`, payload);
