// Mirrors DriverDms.Application.DTOs.IncidentDtos.cs exactly.

export interface CorrectiveActionDto {
  correctiveActionId: number;
  incidentId: number;
  actionTaken: string;
  penaltyTypeName?: string | null;
  actionDate: string;
}

export interface IncidentDto {
  incidentId: number;
  driverId: number;
  driverName: string;
  incidentDate: string;
  incidentTypeName: string;
  description: string;
  severityLevelName: string;
  location?: string | null;
  rootCauseCompleted: boolean;
  correctiveActions: CorrectiveActionDto[];
}

export interface CreateIncidentRequest {
  driverId: number;
  incidentDate: string;
  incidentTypeId: number;
  description: string;
  severityLevelId: number;
  location?: string | null;
}

export interface UpdateIncidentRequest {
  incidentDate: string;
  incidentTypeId: number;
  description: string;
  severityLevelId: number;
  location?: string | null;
  rootCauseCompleted: boolean;
}

export interface AddCorrectiveActionRequest {
  actionTaken: string;
  penaltyTypeId?: number | null;
  actionDate?: string | null;
}

export interface IncidentSearchRequest {
  driverId?: number;
  severityLevelId?: number;
  rootCauseCompleted?: boolean;
  page: number;
  pageSize: number;
}
