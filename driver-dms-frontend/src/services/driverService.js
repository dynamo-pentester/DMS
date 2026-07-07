import api from "./api";
import { API_ENDPOINTS } from "../constants/apiEndpoints";

export const getDriver = (id) => api.get(`${API_ENDPOINTS.DRIVERS}/${id}`);

// params: { searchTerm, statusId, page, pageSize } -> PagedResult<DriverDto>
export const searchDrivers = (params) =>
  api.get(API_ENDPOINTS.DRIVERS, { params });

// CreateDriverRequest
export const createDriver = (payload) => {
 console.log('📤 PAYLOAD:', payload);
 return api.post(API_ENDPOINTS.DRIVERS, payload);
};
// UpdateDriverRequest
export const updateDriver = (id, payload) =>
  api.put(`${API_ENDPOINTS.DRIVERS}/${id}`, payload);

// { newStatusId, reason }
export const updateDriverStatus = (id, payload) =>
  api.patch(`${API_ENDPOINTS.DRIVERS}/${id}/status`, payload);

export const deleteDriver = (id) => api.delete(`${API_ENDPOINTS.DRIVERS}/${id}`);
