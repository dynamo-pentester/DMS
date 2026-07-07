import { axiosClient } from '@/api/axiosClient';

export interface DashboardMetrics {
  totalDrivers: number;
  expiringLicenses: number;
  expiringMedical: number;
  expiringTrainings: number;
  pendingNotifications: number;
  driversOnSite: number;
  incidentsBySeverity: { severity: string; count: number }[];
}

export const dashboardService = {
  getMetrics: async (): Promise<DashboardMetrics> => {
    const [
      drivers,
      licenses,
      medical,
      trainings,
      notifications,
      plantMovements,
    ] = await Promise.all([
      axiosClient.get('/drivers', { params: { pageSize: 1 } }),
      axiosClient.get('/licenses', { params: { status: 'Expiring', pageSize: 1 } }),
      axiosClient.get('/medical-records', { params: { status: 'Expiring', pageSize: 1 } }),
      axiosClient.get('/trainings', { params: { status: 'Expiring', pageSize: 1 } }),
      axiosClient.get('/notifications', { params: { status: 'Pending', pageSize: 1 } }),
      axiosClient.get('/plant-movements', { params: { onSiteOnly: true, pageSize: 1 } }),
    ]);

    return {
      totalDrivers: drivers.data.totalCount,
      expiringLicenses: licenses.data.totalCount,
      expiringMedical: medical.data.totalCount,
      expiringTrainings: trainings.data.totalCount,
      pendingNotifications: notifications.data.totalCount,
      driversOnSite: plantMovements.data.totalCount,
      incidentsBySeverity: [],
    };
  },
};
