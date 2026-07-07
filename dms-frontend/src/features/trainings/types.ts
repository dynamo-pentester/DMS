// Mirrors DriverDms.Application.DTOs.TrainingDtos.cs exactly.

export interface TrainingDto {
  trainingId: number;
  driverId: number;
  driverName: string;
  trainingTypeName: string;
  dateCompleted: string;
  validUpto: string;
  trainerName?: string | null;
  /** Valid | Expiring | Expired — computed by TrainingStatusResolver */
  status: string;
}

export interface CreateTrainingRequest {
  driverId: number;
  trainingTypeId: number;
  dateCompleted: string;
  validUpto: string;
  trainerName?: string | null;
}

export interface UpdateTrainingRequest {
  trainingTypeId: number;
  dateCompleted: string;
  validUpto: string;
  trainerName?: string | null;
}

export interface TrainingSearchRequest {
  driverId?: number;
  status?: string;
  page: number;
  pageSize: number;
}
