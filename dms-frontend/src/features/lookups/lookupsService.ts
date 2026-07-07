import { axiosClient } from '@/api/axiosClient';
import { LookupItem } from '@/types/common';

// Raw backend shapes are `{ <x>Id, name }` (id key name varies per endpoint,
// e.g. bloodGroupId, endorsementId) - this normalizes every response to
// `{ id, name }` so the rest of the app never has to know the per-table key name.
function normalize<T extends Record<string, unknown>>(rows: T[]): LookupItem[] {
  return rows.map((row) => {
    const idKey = Object.keys(row).find((k) => k.toLowerCase().endsWith('id'));
    return { id: Number(idKey ? row[idKey] : 0), name: String(row.name ?? '') };
  });
}

async function get(path: string): Promise<LookupItem[]> {
  const { data } = await axiosClient.get(`/lookups/${path}`);
  return normalize(data);
}

// Matches every GET endpoint on LookupsController exactly.
export const lookupsService = {
  getBloodGroups: () => get('blood-groups'),
  getEndorsements: () => get('endorsements'),
  getVehicleTypes: () => get('vehicle-types'),
  getDriverStatusTypes: () => get('driver-status-types'),
  getFitnessStatuses: () => get('fitness-statuses'),
  getIncidentTypes: () => get('incident-types'),
  getSeverityLevels: () => get('severity-levels'),
  getPenaltyTypes: () => get('penalty-types'),
  getPurposeTypes: () => get('purpose-types'),
  getGateNumbers: () => get('gate-numbers'),
  getTrainingTypes: () => get('training-types'),
  getNotificationEntityTypes: () => get('notification-entity-types'),
  getNotificationStatuses: () => get('notification-statuses'),
};
