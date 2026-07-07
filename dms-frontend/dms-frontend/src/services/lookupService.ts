import { api } from "@/api/axiosInstance";
import type { LookupItem } from "@/types/common";

export const lookupService = {
  getBloodGroups: async (): Promise<LookupItem[]> => {
    const { data } = await api.get<any[]>("/lookups/blood-groups");
    return data.map((x) => ({ id: x.bloodGroupId, name: x.name }));
  },

  getEndorsements: async (): Promise<LookupItem[]> => {
    const { data } = await api.get<any[]>("/lookups/endorsements");
    return data.map((x) => ({ id: x.endorsementId, name: x.name }));
  },

  getVehicleTypes: async (): Promise<LookupItem[]> => {
    const { data } = await api.get<any[]>("/lookups/vehicle-types");
    return data.map((x) => ({ id: x.vehicleTypeId, name: x.name }));
  },

  getDriverStatusTypes: async (): Promise<LookupItem[]> => {
    const { data } = await api.get<any[]>("/lookups/driver-status-types");
    return data.map((x) => ({ id: x.driverStatusTypeId, name: x.name }));
  },

  getFitnessStatuses: async (): Promise<LookupItem[]> => {
    const { data } = await api.get<any[]>("/lookups/fitness-statuses");
    return data.map((x) => ({ id: x.fitnessStatusId, name: x.name }));
  },

  getIncidentTypes: async (): Promise<LookupItem[]> => {
    const { data } = await api.get<any[]>("/lookups/incident-types");
    return data.map((x) => ({ id: x.incidentTypeId, name: x.name }));
  },

  getSeverityLevels: async (): Promise<LookupItem[]> => {
    const { data } = await api.get<any[]>("/lookups/severity-levels");
    return data.map((x) => ({ id: x.severityLevelId, name: x.name }));
  },

  getPenaltyTypes: async (): Promise<LookupItem[]> => {
    const { data } = await api.get<any[]>("/lookups/penalty-types");
    return data.map((x) => ({ id: x.penaltyTypeId, name: x.name }));
  },

  getPurposeTypes: async (): Promise<LookupItem[]> => {
    const { data } = await api.get<any[]>("/lookups/purpose-types");
    return data.map((x) => ({ id: x.purposeTypeId, name: x.name }));
  },

  getGateNumbers: async (): Promise<LookupItem[]> => {
    const { data } = await api.get<any[]>("/lookups/gate-numbers");
    return data.map((x) => ({ id: x.gateNumberId, name: x.name }));
  },

  getTrainingTypes: async (): Promise<LookupItem[]> => {
    const { data } = await api.get<any[]>("/lookups/training-types");
    return data.map((x) => ({ id: x.trainingTypeId, name: x.name }));
  },

  getPlants: async (): Promise<LookupItem[]> => {
    const { data } = await api.get<any[]>("/lookups/plants");
    return data.map((x) => ({ id: x.plantId ?? x.id, name: x.name }));
  },

  getTransporters: async (): Promise<LookupItem[]> => {
    const { data } = await api.get<any[]>("/lookups/transporters");
    return data.map((x) => ({ id: x.transporterId ?? x.id, name: x.name }));
  },
};
