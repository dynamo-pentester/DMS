import api from "./api";
import { API_ENDPOINTS } from "../constants/apiEndpoints";

export const getPlantMovement = (id) =>
  api.get(`${API_ENDPOINTS.PLANT_MOVEMENTS}/${id}`);

// params: { driverId, onSiteOnly, page, pageSize }
export const searchPlantMovements = (params) =>
  api.get(API_ENDPOINTS.PLANT_MOVEMENTS, { params });

// CreatePlantMovementRequest -> records entry
export const recordEntry = (payload) =>
  api.post(API_ENDPOINTS.PLANT_MOVEMENTS, payload);

// RecordExitRequest -> same row, PATCH .../exit (not a new record)
export const recordExit = (id, payload = {}) =>
  api.patch(`${API_ENDPOINTS.PLANT_MOVEMENTS}/${id}/exit`, payload);
