import { create } from "zustand";
import {
  getBloodGroups,
  getEndorsements,
  getVehicleTypes,
  getDriverStatusTypes,
  getFitnessStatuses,
  getIncidentTypes,
  getSeverityLevels,
  getPenaltyTypes,
  getPurposeTypes,
  getGateNumbers,
  getTrainingTypes,
  getNotificationEntityTypes,
  getNotificationStatuses,
} from "../services/lookupService";

const EMPTY = {
  bloodGroups: [],
  endorsements: [],
  vehicleTypes: [],
  driverStatusTypes: [],
  fitnessStatuses: [],
  incidentTypes: [],
  severityLevels: [],
  penaltyTypes: [],
  purposeTypes: [],
  gateNumbers: [],
  trainingTypes: [],
  notificationEntityTypes: [],
  notificationStatuses: [],
};

export const useLookupStore = create((set, get) => ({
  ...EMPTY,
  loaded: false,
  loading: false,

  loadAll: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    try {
      const [
        bloodGroups,
        endorsements,
        vehicleTypes,
        driverStatusTypes,
        fitnessStatuses,
        incidentTypes,
        severityLevels,
        penaltyTypes,
        purposeTypes,
        gateNumbers,
        trainingTypes,
        notificationEntityTypes,
        notificationStatuses,
      ] = await Promise.all([
        getBloodGroups(),
        getEndorsements(),
        getVehicleTypes(),
        getDriverStatusTypes(),
        getFitnessStatuses(),
        getIncidentTypes(),
        getSeverityLevels(),
        getPenaltyTypes(),
        getPurposeTypes(),
        getGateNumbers(),
        getTrainingTypes(),
        getNotificationEntityTypes(),
        getNotificationStatuses(),
      ]);

      set({
        bloodGroups: bloodGroups.data,
        endorsements: endorsements.data,
        vehicleTypes: vehicleTypes.data,
        driverStatusTypes: driverStatusTypes.data,
        fitnessStatuses: fitnessStatuses.data,
        incidentTypes: incidentTypes.data,
        severityLevels: severityLevels.data,
        penaltyTypes: penaltyTypes.data,
        purposeTypes: purposeTypes.data,
        gateNumbers: gateNumbers.data,
        trainingTypes: trainingTypes.data,
        notificationEntityTypes: notificationEntityTypes.data,
        notificationStatuses: notificationStatuses.data,
        loaded: true,
        loading: false,
      });
    } catch (err) {
      console.error("Failed to load lookups", err);
      set({ loading: false });
    }
  },

  reset: () => set({ ...EMPTY, loaded: false, loading: false }),
}));
