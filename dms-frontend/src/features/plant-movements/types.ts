// Mirrors DriverDms.Application.DTOs.PlantMovementDtos.cs exactly.

export interface PlantMovementDto {
  movementId: number;
  driverId: number;
  driverName: string;
  vehicleNo: string;
  dateOfEntry: string;
  dateOfExit?: string | null;
  purposeTypeName: string;
  gateNumberName: string;
  isOnSite: boolean;
}

export interface CreatePlantMovementRequest {
  driverId: number;
  vehicleNo: string;
  dateOfEntry?: string | null;
  purposeTypeId: number;
  gateNumberId: number;
}

export interface RecordExitRequest {
  dateOfExit?: string | null;
}

export interface PlantMovementSearchRequest {
  driverId?: number;
  onSiteOnly?: boolean;
  page: number;
  pageSize: number;
}
