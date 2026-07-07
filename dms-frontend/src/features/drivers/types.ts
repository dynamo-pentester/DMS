// Mirrors DriverDms.Application.DTOs.DriverDtos.cs exactly.

export interface DriverDto {
  driverId: number;
  driverCode: string;
  fullName: string;
  fatherName?: string | null;
  dateOfBirth: string;
  mobile: string;
  address?: string | null;
  bloodGroupName?: string | null;
  aadhaarLast4?: string | null;
  emergencyContactName?: string | null;
  emergencyContactRelation?: string | null;
  emergencyContactPhone?: string | null;
  remarks?: string | null;
  currentStatusName: string;
  currentTransporterName?: string | null;
}

export interface CreateDriverRequest {
  fullName: string;
  fatherName?: string | null;
  dateOfBirth: string;
  mobile: string;
  address?: string | null;
  bloodGroupId?: number | null;
  aadhaarNo?: string | null;
  emergencyContactName?: string | null;
  emergencyContactRelation?: string | null;
  emergencyContactPhone?: string | null;
}

export interface UpdateDriverRequest {
  fullName: string;
  fatherName?: string | null;
  dateOfBirth: string;
  mobile: string;
  address?: string | null;
  bloodGroupId?: number | null;
  emergencyContactName?: string | null;
  emergencyContactRelation?: string | null;
  emergencyContactPhone?: string | null;
  remarks?: string | null;
}

export interface DriverSearchRequest {
  searchTerm?: string;
  statusId?: number;
  page: number;
  pageSize: number;
}

export interface UpdateDriverStatusRequest {
  newStatusId: number;
  reason?: string;
}
