import { api } from "@/api/axiosInstance";
import type { LookupItem } from "@/types/common";

export interface DriverLookupItem {
  id: number;
  code: string;
  name: string;
  /** The driver's current transporter, if any - used to auto-fill the transporter
   *  field when reporting an incident. */
  currentTransporterName?: string | null;
  /** The driver's most recent non-deleted license number, if any.
   *  Used by DriverSearchCombobox so users can filter by license digits. */
  licenseNo?: string | null;
  currentStatusName?: string | null;
}

/** Backs the License ID selector used wherever a Driver used to be picked directly
 *  (Trainings, Medical Records, Incidents, Reports & Analytics, Drivers filter).
 *  Picking a license resolves driverId/driverCode/driverName for auto-fill. */
export interface LicenseLookupItem {
  licenseId: number;
  licenseNo: string;
  driverId: number;
  driverCode: string;
  driverFullName: string;
  validTill: string;
}

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

  /** Fetch all drivers for use in form dropdowns – returns driverId, driverCode, fullName, and
   *  the driver's most recent license number (joined from /lookups/licenses). */
  getDrivers: async (): Promise<DriverLookupItem[]> => {
    const [driversRes, licensesRes] = await Promise.all([
      api.get<any>("/drivers", { params: { page: 1, pageSize: 500 } }),
      api.get<any[]>("/lookups/licenses").catch(() => ({ data: [] as any[] })),
    ]);
    const items: any[] = driversRes.data.items ?? driversRes.data;
    // Build map of driverId → licenseNo (most recent license; the lookup endpoint
    // already returns the most recent non-deleted license per driver)
    const licenseMap: Record<number, string> = {};
    for (const l of (licensesRes.data as any[])) {
      if (l.driverId && l.licenseNo) {
        // Keep whichever comes last (API should already be sorted newest-first)
        licenseMap[l.driverId] = l.licenseNo;
      }
    }
    return items.map((d: any) => ({
      id: d.driverId,
      code: d.driverCode,
      name: d.fullName,
      licenseNo: licenseMap[d.driverId] ?? null,
      currentTransporterName: d.currentTransporterName,
      currentStatusName: d.currentStatusName,
    }));
  },

  getLicenses: async (): Promise<LicenseLookupItem[]> => {
    const { data } = await api.get<any[]>("/lookups/licenses");
    return data.map((l) => ({
      licenseId: l.licenseId,
      licenseNo: l.licenseNo,
      driverId: l.driverId,
      driverCode: l.driverCode,
      driverFullName: l.driverFullName,
      validTill: l.validTill,
    }));
  },
};
