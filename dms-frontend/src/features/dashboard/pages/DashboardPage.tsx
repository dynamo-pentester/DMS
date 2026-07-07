import { useEffect, useState } from 'react';
import { Alert, Box, Card, CardContent, Grid, Typography } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import SchoolIcon from '@mui/icons-material/School';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import FactoryIcon from '@mui/icons-material/Factory';
import { PageHeader } from '@/components/PageHeader';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/features/auth/authSlice';
import { dashboardService, DashboardMetrics } from '../dashboardService';
import { LoadingState } from '@/components/LoadingState';
import { toast } from 'react-toastify';
import { useHasRole } from '@/components/RoleRoute';
import { MODULE_PERMISSIONS } from '@/config/rbac';

function MetricCard({ title, value, icon, color }: { title: string, value: number, icon: React.ReactNode, color: string }) {
  return (
    <Card sx={{ height: '100%', borderTop: `4px solid ${color}` }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{title}</Typography>
            <Typography variant="h3">{value}</Typography>
          </Box>
          <Box sx={{ color, opacity: 0.8, p: 1, borderRadius: 1, bgcolor: `${color}15` }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const user = useAppSelector(selectCurrentUser);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const canViewDrivers = useHasRole(MODULE_PERMISSIONS.drivers.read);
  const canViewPlantMovements = useHasRole(MODULE_PERMISSIONS.plantMovements.read);
  const canViewNotifications = useHasRole(MODULE_PERMISSIONS.notifications.read);
  const canViewLicenses = useHasRole(MODULE_PERMISSIONS.licenses.read);
  const canViewMedical = useHasRole(MODULE_PERMISSIONS.medical.read);
  const canViewTrainings = useHasRole(MODULE_PERMISSIONS.trainings.read);

  useEffect(() => {
    dashboardService.getMetrics()
      .then((data) => {
        setMetrics(data);
        if (data.pendingNotifications > 0) {
          toast.info(`You have ${data.pendingNotifications} pending expiry reminder${data.pendingNotifications > 1 ? 's' : ''}.`, {
            toastId: 'dashboard-reminders',
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;

  return (
    <Box>
      <PageHeader title="Dashboard" subtitle={`Welcome back, ${user?.fullName ?? ''}`} />
      
      {metrics && (
        <Box sx={{ mb: 3 }}>
          <Alert severity={metrics.pendingNotifications > 0 ? 'info' : 'success'}>
            {metrics.pendingNotifications > 0
              ? `There are ${metrics.pendingNotifications} pending notification${metrics.pendingNotifications > 1 ? 's' : ''} to review.`
              : 'All active reminders are currently clear.'}
          </Alert>
        </Box>
      )}

      {metrics && (
        <Grid container spacing={3}>
          {canViewDrivers && (
            <Grid item xs={12} sm={6} md={4}>
              <MetricCard 
                title="Total Drivers" 
                value={metrics.totalDrivers} 
                icon={<PeopleIcon />} 
                color="#2196f3" 
              />
            </Grid>
          )}
          {canViewPlantMovements && (
            <Grid item xs={12} sm={6} md={4}>
              <MetricCard 
                title="Drivers On-Site" 
                value={metrics.driversOnSite} 
                icon={<FactoryIcon />} 
                color="#4caf50" 
              />
            </Grid>
          )}
          {canViewNotifications && (
            <Grid item xs={12} sm={6} md={4}>
              <MetricCard 
                title="Pending Notifications" 
                value={metrics.pendingNotifications} 
                icon={<NotificationsActiveIcon />} 
                color="#ff9800" 
              />
            </Grid>
          )}
          
          {canViewLicenses && (
            <Grid item xs={12} sm={6} md={4}>
              <MetricCard 
                title="Expiring Licenses" 
                value={metrics.expiringLicenses} 
                icon={<WarningAmberIcon />} 
                color="#f44336" 
              />
            </Grid>
          )}
          {canViewMedical && (
            <Grid item xs={12} sm={6} md={4}>
              <MetricCard 
                title="Expiring Medical Records" 
                value={metrics.expiringMedical} 
                icon={<LocalHospitalIcon />} 
                color="#f44336" 
              />
            </Grid>
          )}
          {canViewTrainings && (
            <Grid item xs={12} sm={6} md={4}>
              <MetricCard 
                title="Expiring Trainings" 
                value={metrics.expiringTrainings} 
                icon={<SchoolIcon />} 
                color="#ff9800" 
              />
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
}
