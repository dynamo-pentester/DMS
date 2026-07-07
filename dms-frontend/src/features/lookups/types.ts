import { LookupItem } from '@/types/common';

// One key per LookupsController endpoint (Driver.API/Controllers/LookupsController.cs).
export interface LookupsState {
  bloodGroups: LookupItem[];
  endorsements: LookupItem[];
  vehicleTypes: LookupItem[];
  driverStatusTypes: LookupItem[];
  fitnessStatuses: LookupItem[];
  incidentTypes: LookupItem[];
  severityLevels: LookupItem[];
  penaltyTypes: LookupItem[];
  purposeTypes: LookupItem[];
  gateNumbers: LookupItem[];
  trainingTypes: LookupItem[];
  notificationEntityTypes: LookupItem[];
  notificationStatuses: LookupItem[];
  loaded: boolean;
  loading: boolean;
}
