import type { ExpiryStatus, SearchParams } from "./common";

export interface Training {
  trainingId: number;
  driverId: number;
  driverName: string;
  trainingTypeName: string;
  dateCompleted: string;
  validUpto: string;
  trainerName?: string | null;
  status: ExpiryStatus;
}

export interface CreateTrainingRequest {
  driverId: number;
  trainingTypeId: number;
  dateCompleted: string;
  validUpto: string;
  trainerName?: string;
}

export interface UpdateTrainingRequest {
  trainingTypeId: number;
  dateCompleted: string;
  validUpto: string;
  trainerName?: string;
}

export interface TrainingSearchParams extends SearchParams {
  driverId?: number;
  status?: ExpiryStatus;
}
