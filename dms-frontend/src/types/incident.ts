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
  /** True once a report has been uploaded via POST /api/incidents/{id}/report */
  hasReport: boolean;
  /** Transporter on file for the driver at the time of this incident */
  transporterName?: string | null;
  /** True if the employee reported the driver had since moved to a different contractor */
  transporterChanged: boolean;
}

export interface CorrectiveAction {
  correctiveActionId: number;
  incidentId: number;
  actionTaken: string;
  penaltyTypeName?: string | null;
  actionDate: string;
  /** True once a letter of apology / supporting photo has been uploaded */
  hasAttachment: boolean;
  /** True once a formal apology document was uploaded at corrective-action creation time */
  hasApologyDocument: boolean;
}

export interface IncidentSearchParams {
  page?: number;
  pageSize?: number;
  driverId?: number;
  severity?: string;
  dateFrom?: string;
  dateTo?: string;
  /** Filters to incidents whose driver holds a license number containing this text. */
  licenseNo?: string;
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
  /** Auto-filled from the driver's current transporter, or the newly reported one if transporterChanged is true */
  transporterName?: string | null;
  transporterChanged: boolean;
}

export type UpdateIncidentRequest = Partial<Omit<CreateIncidentRequest, "driverId">>;

export interface CreateCorrectiveActionRequest {
  incidentId: number;
  actionTaken: string;
  penaltyTypeId?: number;
  actionDate: string;
}

/** Alias used by incidentService */
export type AddCorrectiveActionRequest = CreateCorrectiveActionRequest;

