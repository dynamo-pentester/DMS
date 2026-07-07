// Must match RoleSeeder.DefaultRoles in Driver.Infrastructure exactly, including
// spacing - these are seeded as real Identity role strings, not enum-backed IDs.
export const ROLES = {
  SYSTEM_ADMIN: 'System Administrator',
  HR_EXECUTIVE: 'HR Executive',
  SAFETY_OFFICER: 'Safety Officer',
  GATE_SECURITY: 'Gate Security',
  TRANSPORT_COORDINATOR: 'Transport Coordinator',
  MANAGER: 'Manager',
} as const;

export const ALL_ROLES = Object.values(ROLES);

export type Role = (typeof ROLES)[keyof typeof ROLES];
