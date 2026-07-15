import type { SearchParams } from "./common";

// Mirrors DriverDms.Application.DTOs.DriverDto
export interface Driver {
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
  /** Most recent license number on file, if any */
  licenseNo?: string | null;
  approvalStatus: 'Approved' | 'PendingApproval' | 'Rejected';
  approvedBy?: number | null;
  approvedDate?: string | null;
  /** True once a photo has been uploaded via POST /api/drivers/{id}/photo */
  hasPhoto: boolean;
}

// Mirrors CreateDriverRequest
export interface CreateDriverRequest {
  fullName: string;
  fatherName?: string;
  dateOfBirth: string;
  mobile: string;
  address?: string;
  bloodGroupId?: number;
  aadhaarNo?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
}

// Mirrors UpdateDriverRequest
export interface UpdateDriverRequest {
  fullName: string;
  fatherName?: string;
  dateOfBirth: string;
  mobile: string;
  address?: string;
  bloodGroupId?: number;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  remarks?: string;
}

export interface UpdateDriverStatusRequest {
  newStatusId: number;
  reason?: string;
}

// Mirrors DriverSearchRequest
export interface DriverSearchParams extends SearchParams {
  searchTerm?: string;
  statusId?: number;
  licenseNo?: string;
}
