// Mirrors DriverDms.Application.DTOs.TransporterDtos.cs exactly.

export interface TransporterDto {
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
  contactPerson?: string | null;
  mobile?: string | null;
  address?: string | null;
  agreementValidTill?: string | null;
}

export interface UpdateTransporterRequest {
  name: string;
  contactPerson?: string | null;
  mobile?: string | null;
  address?: string | null;
  agreementValidTill?: string | null;
  isActive: boolean;
}

export interface DriverTransporterAssignmentDto {
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
  assignmentDate?: string | null;
}

export interface TransporterSearchRequest {
  searchTerm?: string;
  isActive?: boolean;
  page: number;
  pageSize: number;
}
