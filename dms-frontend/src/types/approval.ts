export interface DriverApproval {
  id: number;
  driverId: number;
  driverCode: string;
  driverName: string;
  requestedByUserId: number;
  requestedByName?: string | null;
  assignedToManagerId: number;
  status: 'PendingApproval' | 'Approved' | 'Rejected';
  comments?: string | null;
  requestedDate: string;
  actionDate?: string | null;
}

export interface ApproveRejectRequest {
  comments?: string;
}
