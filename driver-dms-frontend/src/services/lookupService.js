import api from "./api";
import { API_ENDPOINTS } from "../constants/apiEndpoints";

const L = API_ENDPOINTS.LOOKUPS;

export const getBloodGroups = () => api.get(L.BLOOD_GROUPS);
export const getEndorsements = () => api.get(L.ENDORSEMENTS);
export const getVehicleTypes = () => api.get(L.VEHICLE_TYPES);
export const getDriverStatusTypes = () => api.get(L.DRIVER_STATUS_TYPES);
export const getFitnessStatuses = () => api.get(L.FITNESS_STATUSES);
export const getIncidentTypes = () => api.get(L.INCIDENT_TYPES);
export const getSeverityLevels = () => api.get(L.SEVERITY_LEVELS);
export const getPenaltyTypes = () => api.get(L.PENALTY_TYPES);
export const getPurposeTypes = () => api.get(L.PURPOSE_TYPES);
export const getGateNumbers = () => api.get(L.GATE_NUMBERS);
export const getTrainingTypes = () => api.get(L.TRAINING_TYPES);
export const getNotificationEntityTypes = () => api.get(L.NOTIFICATION_ENTITY_TYPES);
export const getNotificationStatuses = () => api.get(L.NOTIFICATION_STATUSES);
