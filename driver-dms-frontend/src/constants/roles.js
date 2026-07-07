// Must match RoleSeeder.DefaultRoles in Driver.Infrastructure exactly, including spacing.
// NOTE: Driver.Application/DTOs/AuthDtos.cs has a stale XML comment listing a different,
// wrong set of role names (SystemAdmin/FleetManager/SafetyOfficer/HRManager/
// TransporterCoordinator/ReadOnly). That comment is outdated - RoleSeeder.cs is what the
// API actually seeds on startup and validates against on /auth/register. Use this list.
export const ROLES = {
  SYSTEM_ADMINISTRATOR: "System Administrator",
  HR_EXECUTIVE: "HR Executive",
  SAFETY_OFFICER: "Safety Officer",
  GATE_SECURITY: "Gate Security",
  TRANSPORT_COORDINATOR: "Transport Coordinator",
  MANAGER: "Manager",
};

export const ALL_ROLES = Object.values(ROLES);

// Mirrors the Module x Role authorization matrix in the design doc (Driver_DMS_Final_Plan.md
// section 4.1) and each controller's [Authorize(Roles = "...")] attribute. Used by RoleGuard
// to hide actions the backend would 403 on, per module.
export const MODULE_PERMISSIONS = {
  DRIVERS_WRITE: [ROLES.SYSTEM_ADMINISTRATOR, ROLES.HR_EXECUTIVE],
  DRIVERS_DELETE: [ROLES.SYSTEM_ADMINISTRATOR],
  TRANSPORTERS_WRITE: [ROLES.SYSTEM_ADMINISTRATOR, ROLES.TRANSPORT_COORDINATOR],
  LICENSES_WRITE: [ROLES.SYSTEM_ADMINISTRATOR, ROLES.SAFETY_OFFICER],
  MEDICAL_WRITE: [ROLES.SYSTEM_ADMINISTRATOR, ROLES.SAFETY_OFFICER],
  TRAINING_WRITE: [ROLES.SYSTEM_ADMINISTRATOR, ROLES.SAFETY_OFFICER],
  PLANT_MOVEMENT_WRITE: [ROLES.SYSTEM_ADMINISTRATOR, ROLES.GATE_SECURITY, ROLES.TRANSPORT_COORDINATOR],
  INCIDENTS_WRITE: [ROLES.SYSTEM_ADMINISTRATOR, ROLES.SAFETY_OFFICER],
  USERS_ROLES_MANAGE: [ROLES.SYSTEM_ADMINISTRATOR],
};
