import api from "./api";
import { API_ENDPOINTS } from "../constants/apiEndpoints";

export const getMedicalRecord = (id) =>
  api.get(`${API_ENDPOINTS.MEDICAL_RECORDS}/${id}`);

// params: { driverId, status, page, pageSize }
export const searchMedicalRecords = (params) =>
  api.get(API_ENDPOINTS.MEDICAL_RECORDS, { params });

export const createMedicalRecord = (payload) =>
  api.post(API_ENDPOINTS.MEDICAL_RECORDS, payload);

export const updateMedicalRecord = (id, payload) =>
  api.put(`${API_ENDPOINTS.MEDICAL_RECORDS}/${id}`, payload);

export const deleteMedicalRecord = (id) =>
  api.delete(`${API_ENDPOINTS.MEDICAL_RECORDS}/${id}`);
