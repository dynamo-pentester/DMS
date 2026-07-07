import api from "./api";
import { API_ENDPOINTS } from "../constants/apiEndpoints";

export const getLicense = (id) => api.get(`${API_ENDPOINTS.LICENSES}/${id}`);

// params: { driverId, status, page, pageSize }
export const searchLicenses = (params) =>
  api.get(API_ENDPOINTS.LICENSES, { params });

// CreateLicenseRequest: { driverId, licenseNo, issueDate, validTill, vehicleTypeId, endorsementIds[] }
export const createLicense = (payload) => api.post(API_ENDPOINTS.LICENSES, payload);

// UpdateLicenseRequest (no driverId)
export const updateLicense = (id, payload) =>
  api.put(`${API_ENDPOINTS.LICENSES}/${id}`, payload);

export const deleteLicense = (id) => api.delete(`${API_ENDPOINTS.LICENSES}/${id}`);
