// Mirrors DriverDms.Application.DTOs.LicenseDtos.cs exactly.

export interface LicenseDto {
  licenseId: number;
  driverId: number;
  driverName: string;
  licenseNo: string;
  issueDate: string;
  validTill: string;
  vehicleTypeName: string;
  endorsements: string[];
  /** Valid | Expiring | Expired — computed by LicenseStatusResolver */
  status: string;
}

export interface CreateLicenseRequest {
  driverId: number;
  licenseNo: string;
  issueDate: string;
  validTill: string;
  vehicleTypeId: number;
  endorsementIds: number[];
}

export interface UpdateLicenseRequest {
  licenseNo: string;
  issueDate: string;
  validTill: string;
  vehicleTypeId: number;
  endorsementIds: number[];
}

export interface LicenseSearchRequest {
  driverId?: number;
  status?: string;
  page: number;
  pageSize: number;
}
