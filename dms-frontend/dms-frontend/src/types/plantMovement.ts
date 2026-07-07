export interface PlantMovement {
  movementId: number;
  driverId: number;
  driverName: string;
  vehicleNo: string;
  transporterId?: number;
  transporterName?: string;
  plantId: number;
  plantName: string;
  entryDateTime: string;
  exitDateTime?: string;
  purpose?: string;
  remarks?: string;
}

export interface PlantMovementSearchParams {
  page?: number;
  pageSize?: number;
  plantId?: number;
  driverId?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreatePlantMovementRequest {
  driverId: number;
  vehicleNo: string;
  transporterId?: number;
  plantId: number;
  entryDateTime: string;
  exitDateTime?: string;
  purpose?: string;
  remarks?: string;
}

export type UpdatePlantMovementRequest = Partial<Omit<CreatePlantMovementRequest, "driverId">>;

/** Alias for backward compatibility */
export interface RecordExitRequest {
  exitDateTime: string;
}

