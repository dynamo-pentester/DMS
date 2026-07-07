import type { ExpiryStatus, SearchParams } from "./common";

export interface License {
  licenseId: number;
  driverId: number;
  driverName: string;
  licenseNo: string;
  issueDate: string;
  validTill: string;
  vehicleTypeName: string;
  endorsements: string[];
  status: ExpiryStatus;
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

export interface LicenseSearchParams extends SearchParams {
  driverId?: number;
  status?: ExpiryStatus;
}
