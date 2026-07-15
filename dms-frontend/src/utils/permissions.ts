export type Role =
  | "System Administrator"
  | "Employee"
  | "Safety Officer"
  | "Gate Security"
  | "Transport Coordinator"
  | "HOD";

export type Module =
  | "Drivers"
  | "Transporters"
  | "Licenses"
  | "MedicalRecords"
  | "Trainings"
  | "Incidents"
  | "Reports"
  | "Users"
  | "Approvals";

export type Action =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "assign"
  | "approve"
  | "download"
  | "upload"
  | "export"
  | "import"
  | "settings";

export type PermissionLevel = "CRUD" | "View" | "Limited" | "Full" | "None";

// Maps (Role, Module) -> PermissionLevel as defined in the rules matrix
export const ROLE_MODULE_MATRIX: Record<Role, Record<Module, PermissionLevel>> = {
  "System Administrator": {
    Drivers: "CRUD",
    Transporters: "CRUD",
    Licenses: "CRUD",
    MedicalRecords: "CRUD",
    Trainings: "CRUD",
    Incidents: "CRUD",
    Reports: "Full",
    Users: "CRUD",
    Approvals: "None",
  },
  "Employee": {
    Drivers: "CRUD",
    Transporters: "CRUD",
    Licenses: "CRUD",
    MedicalRecords: "CRUD",
    Trainings: "CRUD",
    Incidents: "CRUD",
    Reports: "None",
    Users: "None",
    Approvals: "View",
  },
  "Safety Officer": {
    Drivers: "View",
    Transporters: "View",
    Licenses: "CRUD",
    MedicalRecords: "CRUD",
    Trainings: "CRUD",
    Incidents: "CRUD",
    Reports: "Full",
    Users: "None",
    Approvals: "None",
  },
  "Gate Security": {
    Drivers: "View",
    Transporters: "View",
    Licenses: "View",
    MedicalRecords: "View",
    Trainings: "View",
    Incidents: "View",
    Reports: "Limited",
    Users: "None",
    Approvals: "None",
  },
  "Transport Coordinator": {
    Drivers: "View",
    Transporters: "CRUD",
    Licenses: "View",
    MedicalRecords: "View",
    Trainings: "View",
    Incidents: "View",
    Reports: "Full",
    Users: "None",
    Approvals: "None",
  },
  "HOD": {
    Drivers: "CRUD",
    Transporters: "CRUD",
    Licenses: "CRUD",
    MedicalRecords: "CRUD",
    Trainings: "CRUD",
    Incidents: "CRUD",
    Reports: "Full",
    Users: "None",
    Approvals: "CRUD",
  },
};

// Maps PermissionLevel -> allowed individual Action operations
export const PERMISSION_ACTIONS: Record<PermissionLevel, Record<Action, boolean>> = {
  CRUD: {
    create: true,
    read: true,
    update: true,
    delete: true,
    assign: true,
    approve: true,
    download: true,
    upload: true,
    export: true,
    import: true,
    settings: false,
  },
  View: {
    create: false,
    read: true,
    update: false,
    delete: false,
    assign: false,
    approve: false,
    download: true,
    upload: false,
    export: true,
    import: false,
    settings: false,
  },
  Full: {
    create: true,
    read: true,
    update: true,
    delete: true,
    assign: true,
    approve: true,
    download: true,
    upload: true,
    export: true,
    import: true,
    settings: true,
  },
  Limited: {
    create: false,
    read: true,
    update: false,
    delete: false,
    assign: false,
    approve: false,
    download: false,
    upload: false,
    export: false,
    import: false,
    settings: false,
  },
  None: {
    create: false,
    read: false,
    update: false,
    delete: false,
    assign: false,
    approve: false,
    download: false,
    upload: false,
    export: false,
    import: false,
    settings: false,
  },
};

/**
 * Main utility to verify if a given list of roles has access to an action inside a module.
 */
export function hasPermission(roles: Role[], module: Module, action: Action): boolean {
  if (!roles || roles.length === 0) return false;
  
  return roles.some((role) => {
    const level = ROLE_MODULE_MATRIX[role]?.[module] || "None";
    return PERMISSION_ACTIONS[level]?.[action] || false;
  });
}

/**
 * Utility to verify if a list of roles has read access to a module page.
 */
export function hasModuleAccess(roles: Role[], module: Module): boolean {
  return hasPermission(roles, module, "read");
}
