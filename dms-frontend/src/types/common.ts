// Mirrors DriverDms.Application.DTOs.PagedResult<T>
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface SearchParams {
  page?: number;
  pageSize?: number;
}

// The API's roles come from RoleSeeder.DefaultRoles - keep this in sync with the backend.
export const ROLES = [
  "System Administrator",
  "Employee",
  "Safety Officer",
  "Gate Security",
  "Transport Coordinator",
  "HOD",
] as const;

export type Role = (typeof ROLES)[number];

// Normalized id/name pair used throughout the UI (selects, chips, etc.)
// NOTE: the raw /api/lookups/* endpoints do NOT return a generic {id, name} shape -
// each one returns its own PK name, e.g. { bloodGroupId, name }, { vehicleTypeId, name }.
// See services/lookupService.ts for the normalization step.
export interface LookupItem {
  id: number;
  name: string;
}

// Status computed by the backend's LicenseStatusResolver / MedicalStatusResolver / TrainingStatusResolver
export type ExpiryStatus = "Valid" | "Expiring" | "Expired";

// Shape returned for validation failures (FluentValidation auto-validation / ModelState)
export interface ValidationErrorResponse {
  errors: Record<string, string[]>;
  title?: string;
  status?: number;
}

// Shape returned for business-rule failures (controllers catching InvalidOperationException)
export interface SimpleErrorResponse {
  error: string;
}
