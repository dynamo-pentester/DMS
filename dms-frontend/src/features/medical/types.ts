// Mirrors DriverDms.Application.DTOs.MedicalRecordDtos.cs exactly.

export interface MedicalRecordDto {
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
  /** Valid | Expiring | Expired — computed by MedicalStatusResolver */
  status: string;
}

export interface CreateMedicalRecordRequest {
  driverId: number;
  examDate: string;
  fitnessStatusId: number;
  bp?: string | null;
  visionTestPass: boolean;
  alcoholTestPass: boolean;
  chronicIllness: boolean;
  chronicIllnessRemarks?: string | null;
  validTill: string;
}

export interface UpdateMedicalRecordRequest {
  examDate: string;
  fitnessStatusId: number;
  bp?: string | null;
  visionTestPass: boolean;
  alcoholTestPass: boolean;
  chronicIllness: boolean;
  chronicIllnessRemarks?: string | null;
  validTill: string;
}

export interface MedicalRecordSearchRequest {
  driverId?: number;
  status?: string;
  page: number;
  pageSize: number;
}
