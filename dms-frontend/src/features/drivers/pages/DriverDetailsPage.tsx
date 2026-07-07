import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Box, Button, Divider, Grid, Paper, Stack, Typography } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { toast } from 'react-toastify';
import { PageHeader } from '@/components/PageHeader';
import { LoadingState } from '@/components/LoadingState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { StatusChip } from '@/components/StatusChip';
import { useAppDispatch } from '@/store/hooks';
import { deleteDriver, getDriver } from '../driversSlice';
import { DriverDto } from '../types';
import { ROUTES } from '@/constants/routes';
import { formatDate } from '@/utils/dateUtils';
import { useHasRole } from '@/components/RoleRoute';
import { ROLES } from '@/constants/roles';
import { MODULE_PERMISSIONS } from '@/config/rbac';
import { licensesService } from '../../licenses/licensesService';
import { medicalService } from '../../medical/medicalService';
import { LicenseDto } from '../../licenses/types';
import { MedicalRecordDto } from '../../medical/types';

export default function DriverDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [driver, setDriver] = useState<DriverDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [licenses, setLicenses] = useState<LicenseDto[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecordDto[]>([]);

  const canEdit = useHasRole(MODULE_PERMISSIONS.drivers.write);
  const canDelete = useHasRole([ROLES.SYSTEM_ADMIN]);

  useEffect(() => {
    dispatch(getDriver(Number(id)))
      .unwrap()
      .then(setDriver)
      .catch(() => {
        toast.error('Driver not found.');
        navigate(ROUTES.DRIVERS);
      })
      .finally(() => setLoading(false));

    licensesService.search({ driverId: Number(id), page: 1, pageSize: 100 })
      .then(res => setLicenses(res.items))
      .catch(() => toast.error('Failed to load licenses.'));

    medicalService.search({ driverId: Number(id), page: 1, pageSize: 100 })
      .then(res => setMedicalRecords(res.items))
      .catch(() => toast.error('Failed to load medical records.'));
  }, [id, dispatch, navigate]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await dispatch(deleteDriver(Number(id))).unwrap();
      toast.success('Driver deleted');
      navigate(ROUTES.DRIVERS);
    } catch (err: any) {
      toast.error(err || 'Failed to delete driver');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) return <LoadingState />;
  if (!driver) return null;

  return (
    <Box>
      <PageHeader
        title={driver.fullName}
        subtitle={`Driver Code: ${driver.driverCode}`}
        breadcrumbs={[
          { label: 'Drivers', to: ROUTES.DRIVERS },
          { label: driver.driverCode },
        ]}
        actions={
          <>
            {canEdit && (
              <Button
                variant="outlined"
                startIcon={<EditOutlinedIcon />}
                onClick={() => navigate(ROUTES.DRIVER_EDIT(driver.driverId))}
              >
                Edit
              </Button>
            )}
            {canDelete && (
              <Button
                color="error"
                startIcon={<DeleteOutlineIcon />}
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete
              </Button>
            )}
          </>
        }
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h3" sx={{ mb: 2 }}>Personal Details</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={4}>
                <Typography variant="body2" color="text.secondary">Mobile</Typography>
                <Typography variant="body1">{driver.mobile}</Typography>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Typography variant="body2" color="text.secondary">Date of Birth</Typography>
                <Typography variant="body1">{formatDate(driver.dateOfBirth)}</Typography>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Typography variant="body2" color="text.secondary">Blood Group</Typography>
                <Typography variant="body1">{driver.bloodGroupName || '—'}</Typography>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Typography variant="body2" color="text.secondary">Father's Name</Typography>
                <Typography variant="body1">{driver.fatherName || '—'}</Typography>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Typography variant="body2" color="text.secondary">Aadhaar Last 4</Typography>
                <Typography variant="body1">{driver.aadhaarLast4 ? `xxxx xxxx ${driver.aadhaarLast4}` : '—'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Address</Typography>
                <Typography variant="body1">{driver.address || '—'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Remarks</Typography>
                <Typography variant="body1">{driver.remarks || '—'}</Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h3" sx={{ mb: 2 }}>Emergency Contact</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">Name</Typography>
                <Typography variant="body1">{driver.emergencyContactName || '—'}</Typography>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Typography variant="body2" color="text.secondary">Relation</Typography>
                <Typography variant="body1">{driver.emergencyContactRelation || '—'}</Typography>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Typography variant="body2" color="text.secondary">Phone</Typography>
                <Typography variant="body1">{driver.emergencyContactPhone || '—'}</Typography>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
               <Typography variant="h3">Licenses</Typography>
            </Box>
            {licenses.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No licenses found.</Typography>
            ) : (
              <Stack spacing={2}>
                {licenses.map(lic => (
                  <Box key={lic.licenseId} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">License No</Typography>
                        <Typography variant="body1">{lic.licenseNo}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Vehicle Type</Typography>
                        <Typography variant="body1">{lic.vehicleTypeName}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Valid Till</Typography>
                        <Typography variant="body1">{formatDate(lic.validTill)}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Status</Typography>
                        <StatusChip status={lic.status} />
                      </Grid>
                    </Grid>
                  </Box>
                ))}
              </Stack>
            )}

            <Alert severity="info" sx={{ mt: 3 }}>
              Driver photos and document upload are not exposed by the current backend API, so this profile view only shows the data already available from the service.
            </Alert>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
               <Typography variant="h3">Medical & Fitness Records</Typography>
            </Box>
            {medicalRecords.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No medical records found.</Typography>
            ) : (
              <Stack spacing={2}>
                {medicalRecords.map(med => (
                  <Box key={med.medicalRecordId} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" color="text.secondary">Exam Date</Typography>
                        <Typography variant="body1">{formatDate(med.examDate)}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" color="text.secondary">Valid Till</Typography>
                        <Typography variant="body1">{formatDate(med.validTill)}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" color="text.secondary">Fitness Status</Typography>
                        <StatusChip status={med.fitnessStatusName} />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" color="text.secondary">BP</Typography>
                        <Typography variant="body1">{med.bp || '—'}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" color="text.secondary">Vision Test</Typography>
                        <Typography variant="body1">{med.visionTestPass ? 'Pass' : 'Fail'}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" color="text.secondary">Alcohol Test</Typography>
                        <Typography variant="body1">{med.alcoholTestPass ? 'Pass' : 'Fail'}</Typography>
                      </Grid>
                    </Grid>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h3" sx={{ mb: 2 }}>Status</Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Current Status</Typography>
                <StatusChip status={driver.currentStatusName} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Assigned Transporter</Typography>
                <Typography variant="body1">{driver.currentTransporterName || 'Unassigned'}</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Driver"
        message="Are you sure you want to delete this driver? This action cannot be undone."
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </Box>
  );
}
