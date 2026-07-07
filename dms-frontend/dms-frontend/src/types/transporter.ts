import type { SearchParams } from "./common";

export interface Transporter {
  transporterId: number;
  name: string;
  contactPerson?: string | null;
  mobile?: string | null;
  address?: string | null;
  agreementValidTill?: string | null;
  isActive: boolean;
  currentDriverCount: number;
}

export interface CreateTransporterRequest {
  name: string;
  contactPerson?: string;
  mobile?: string;
  address?: string;
  agreementValidTill?: string;
}

export interface UpdateTransporterRequest {
  name: string;
  contactPerson?: string;
  mobile?: string;
  address?: string;
  agreementValidTill?: string;
  isActive: boolean;
}

export interface DriverTransporterAssignment {
  assignmentId: number;
  driverId: number;
  driverName: string;
  transporterId: number;
  transporterName: string;
  assignmentDate: string;
  endDate?: string | null;
  isCurrent: boolean;
}

export interface AssignDriverRequest {
  driverId: number;
  assignmentDate?: string;
}

export interface TransporterSearchParams extends SearchParams {
  searchTerm?: string;
  isActive?: boolean;
}
