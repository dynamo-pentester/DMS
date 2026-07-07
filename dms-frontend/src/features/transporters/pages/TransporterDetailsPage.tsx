import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid, Paper, Stack, TextField, Typography } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '@/components/PageHeader';
import { LoadingState } from '@/components/LoadingState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { StatusChip } from '@/components/StatusChip';
import { ServerDataGrid } from '@/components/ServerDataGrid';
import { useAppDispatch } from '@/store/hooks';
import { getTransporter, deleteTransporter, getAssignmentHistory, assignDriver, unassignDriver } from '../transportersSlice';
import { assignDriverSchema, AssignDriverFormValues } from '../validation/transporterSchemas';
import { TransporterDto, DriverTransporterAssignmentDto } from '../types';
import { ROUTES } from '@/constants/routes';
import { formatDate } from '@/utils/dateUtils';
import { GridColDef } from '@mui/x-data-grid';
import { useHasRole } from '@/components/RoleRoute';
import { ROLES } from '@/constants/roles';
import { MODULE_PERMISSIONS } from '@/config/rbac';

export default function TransporterDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const [transporter, setTransporter] = useState<TransporterDto | null>(null);
  const [history, setHistory] = useState<DriverTransporterAssignmentDto[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [unassignDriverId, setUnassignDriverId] = useState<number | null>(null);

  const canEdit = useHasRole(MODULE_PERMISSIONS.transporters.write);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AssignDriverFormValues>({
    resolver: zodResolver(assignDriverSchema),
  });

  const loadData = () => {
    setLoading(true);
    Promise.all([
      dispatch(getTransporter(Number(id))).unwrap(),
      dispatch(getAssignmentHistory(Number(id))).unwrap(),
    ])
      .then(([transData, historyData]) => {
        setTransporter(transData);
        setHistory(historyData);
      })
      .catch(() => {
        toast.error('Transporter not found.');
        navigate(ROUTES.TRANSPORTERS);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [id, dispatch, navigate]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await dispatch(deleteTransporter(Number(id))).unwrap();
      toast.success('Transporter deleted');
      navigate(ROUTES.TRANSPORTERS);
    } catch (err: any) {
      toast.error(err || 'Failed to delete transporter');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };
  
  const handleAssignDriver = async (values: AssignDriverFormValues) => {
    try {
      await dispatch(assignDriver({ id: Number(id), data: values })).unwrap();
      toast.success('Driver assigned');
      setAssignDialogOpen(false);
      reset();
      loadData(); // reload history and current count
    } catch (err: any) {
      toast.error(err || 'Failed to assign driver');
    }
  };

  const handleUnassignDriver = async () => {
    if (!unassignDriverId) return;
    try {
      await dispatch(unassignDriver({ id: Number(id), driverId: unassignDriverId })).unwrap();
      toast.success('Driver unassigned');
      loadData();
    } catch (err: any) {
      toast.error(err || 'Failed to unassign driver');
    } finally {
      setUnassignDriverId(null);
    }
  };

  if (loading && !transporter) return <LoadingState />;
  if (!transporter) return null;

  const historyColumns: GridColDef[] = [
    { field: 'driverName', headerName: 'Driver Name', flex: 1, minWidth: 200 },
    { field: 'assignmentDate', headerName: 'Assigned On', width: 150, renderCell: (p) => formatDate(p.value) },
    { field: 'endDate', headerName: 'Ended On', width: 150, renderCell: (p) => p.value ? formatDate(p.value) : '—' },
    {
      field: 'isCurrent',
      headerName: 'Status',
      width: 120,
      renderCell: (p) => (
        <Typography variant="body2" color={p.value ? 'success.main' : 'text.secondary'}>
          {p.value ? 'Current' : 'Past'}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => {
        if (!params.row.isCurrent || !canEdit) return null;
        return (
          <Button size="small" color="error" onClick={() => setUnassignDriverId(params.row.driverId)}>
            Unassign
          </Button>
        );
      },
    },
  ];

  return (
    <Box>
      <PageHeader
        title={transporter.name}
        breadcrumbs={[
          { label: 'Transporters', to: ROUTES.TRANSPORTERS },
          { label: transporter.name },
        ]}
        actions={
          <>
            {canEdit && (
              <Button
                variant="outlined"
                startIcon={<EditOutlinedIcon />}
                onClick={() => navigate(ROUTES.TRANSPORTER_EDIT(transporter.transporterId))}
              >
                Edit
              </Button>
            )}
            {canEdit && (
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
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h3" sx={{ mb: 2 }}>Details</Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <StatusChip status={transporter.isActive ? 'Active' : 'Inactive'} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Contact Person</Typography>
                <Typography variant="body1">{transporter.contactPerson || '—'}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Mobile</Typography>
                <Typography variant="body1">{transporter.mobile || '—'}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Address</Typography>
                <Typography variant="body1">{transporter.address || '—'}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Agreement Valid Till</Typography>
                <Typography variant="body1">{transporter.agreementValidTill ? formatDate(transporter.agreementValidTill) : '—'}</Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="body2" color="text.secondary">Current Drivers Assigned</Typography>
                <Typography variant="h4">{transporter.currentDriverCount}</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h3">Driver Assignment History</Typography>
              {canEdit && (
                 <Button
                   size="small"
                   startIcon={<AddIcon />}
                   onClick={() => setAssignDialogOpen(true)}
                 >
                   Assign Driver
                 </Button>
              )}
            </Stack>
            
            <Box sx={{ flexGrow: 1, minHeight: 400 }}>
              <ServerDataGrid
                rows={history}
                columns={historyColumns}
                totalCount={history.length}
                page={1}
                pageSize={100}
                loading={false}
                getRowId={(row) => row.assignmentId}
                onPageChange={() => {}} // Client side pagination only for this sub-table
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Transporter"
        message="Are you sure you want to delete this transporter? This action cannot be undone."
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />

      <ConfirmDialog
        open={!!unassignDriverId}
        title="Unassign Driver"
        message="Are you sure you want to unassign this driver from the transporter?"
        confirmLabel="Unassign"
        destructive
        onConfirm={handleUnassignDriver}
        onCancel={() => setUnassignDriverId(null)}
      />
      
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Driver</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(handleAssignDriver)}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Driver ID"
                type="number"
                fullWidth
                {...register('driverId', { valueAsNumber: true })}
                error={!!errors.driverId}
                helperText={errors.driverId?.message}
              />
              <TextField
                label="Assignment Date (Optional)"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                {...register('assignmentDate')}
                error={!!errors.assignmentDate}
                helperText={errors.assignmentDate?.message}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setAssignDialogOpen(false); reset(); }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? 'Assigning…' : 'Assign'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
