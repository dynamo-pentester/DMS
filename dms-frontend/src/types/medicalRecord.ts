import type { ExpiryStatus, SearchParams } from "./common";

export interface MedicalRecord {
  medicalRecordId: number;
  driverId: number;
  driverName: string;
  examDate: string;
  fitnessStatusName: string;
  bp?: string | null;
  visionTestPass: boolean;
  alcoholTestPass: boolean;
  chronicIllness: boolean;
  chronicIllnessRemarks?: string | null;
  validTill: string;
  status: ExpiryStatus;
  /** True once a certificate has been uploaded via POST /api/medical-records/{id}/certificate */
  hasCertificate: boolean;
}

export interface CreateMedicalRecordRequest {
  driverId: number;
  examDate: string;
  fitnessStatusId: number;
  bp?: string;
  visionTestPass: boolean;
  alcoholTestPass: boolean;
  chronicIllness: boolean;
  chronicIllnessRemarks?: string;
  validTill: string;
}

export interface UpdateMedicalRecordRequest {
  examDate: string;
  fitnessStatusId: number;
  bp?: string;
  visionTestPass: boolean;
  alcoholTestPass: boolean;
  chronicIllness: boolean;
  chronicIllnessRemarks?: string;
  validTill: string;
}

export interface MedicalRecordSearchParams extends SearchParams {
  driverId?: number;
  status?: ExpiryStatus;
  licenseNo?: string;
}
