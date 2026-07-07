export interface Incident {
  incidentId: number;
  driverId: number;
  driverName: string;
  incidentTypeId: number;
  incidentTypeName: string;
  incidentDate: string;
  location?: string;
  description?: string;
  severity: string;
  faultAtDriver: boolean;
  fatalitiesCount: number;
  injuriesCount: number;
  correctiveActions: CorrectiveAction[];
}

export interface CorrectiveAction {
  correctiveActionId: number;
  incidentId: number;
  description: string;
  actionDate: string;
  closedDate?: string;
}

export interface IncidentSearchParams {
  page?: number;
  pageSize?: number;
  driverId?: number;
  severity?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateIncidentRequest {
  driverId: number;
  incidentTypeId: number;
  incidentDate: string;
  location?: string;
  description?: string;
  severity: string;
  faultAtDriver: boolean;
  fatalitiesCount: number;
  injuriesCount: number;
}

export type UpdateIncidentRequest = Partial<Omit<CreateIncidentRequest, "driverId">>;

export interface CreateCorrectiveActionRequest {
  incidentId: number;
  description: string;
  actionDate: string;
  closedDate?: string;
}

/** Alias used by incidentService */
export type AddCorrectiveActionRequest = CreateCorrectiveActionRequest;

