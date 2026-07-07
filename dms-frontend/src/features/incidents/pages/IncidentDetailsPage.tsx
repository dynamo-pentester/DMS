import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '@/components/PageHeader';
import { LoadingState } from '@/components/LoadingState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addCorrectiveAction, deleteIncident, getIncident } from '../incidentsSlice';
import { correctiveActionSchema, CorrectiveActionFormValues } from '../validation/incidentSchemas';
import { IncidentDto } from '../types';
import { ROUTES } from '@/constants/routes';
import { formatDate } from '@/utils/dateUtils';
import { useHasRole } from '@/components/RoleRoute';
import { ROLES } from '@/constants/roles';
import { MODULE_PERMISSIONS } from '@/config/rbac';

export default function IncidentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [incident, setIncident] = useState<IncidentDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [addActionDialogOpen, setAddActionDialogOpen] = useState(false);
  
  const penaltyTypes = useAppSelector((s) => s.lookups.penaltyTypes);

  const canEdit = useHasRole(MODULE_PERMISSIONS.incidents.write);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CorrectiveActionFormValues>({
    resolver: zodResolver(correctiveActionSchema),
  });

  const loadIncident = () => {
    setLoading(true);
    dispatch(getIncident(Number(id)))
      .unwrap()
      .then(setIncident)
      .catch(() => {
        toast.error('Incident not found.');
        navigate(ROUTES.INCIDENTS);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadIncident();
  }, [id, dispatch, navigate]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await dispatch(deleteIncident(Number(id))).unwrap();
      toast.success('Incident deleted');
      navigate(ROUTES.INCIDENTS);
    } catch (err: any) {
      toast.error(err || 'Failed to delete incident');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };
  
  const handleAddAction = async (values: CorrectiveActionFormValues) => {
    try {
      await dispatch(addCorrectiveAction({ incidentId: Number(id), data: values })).unwrap();
      toast.success('Corrective action added');
      setAddActionDialogOpen(false);
      reset();
      loadIncident();
    } catch (err: any) {
      toast.error(err || 'Failed to add corrective action');
    }
  };

  if (loading && !incident) return <LoadingState />;
  if (!incident) return null;

  return (
    <Box>
      <PageHeader
        title={`Incident: ${incident.driverName}`}
        subtitle={`${incident.incidentTypeName} - ${formatDate(incident.incidentDate)}`}
        breadcrumbs={[
          { label: 'Incidents', to: ROUTES.INCIDENTS },
          { label: 'Details' },
        ]}
        actions={
          <>
            {canEdit && (
              <Button
                variant="outlined"
                startIcon={<EditOutlinedIcon />}
                onClick={() => navigate(ROUTES.INCIDENT_EDIT(incident.incidentId))}
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
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h3" sx={{ mb: 2 }}>Incident Details</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Driver ID</Typography>
                <Typography variant="body1">{incident.driverId}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Severity</Typography>
                <Typography variant="body1">{incident.severityLevelName}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Location</Typography>
                <Typography variant="body1">{incident.location || '—'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Root Cause Complete</Typography>
                <Typography variant="body1">{incident.rootCauseCompleted ? 'Yes' : 'No'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Description</Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>{incident.description}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h3">Corrective Actions</Typography>
              {canEdit && (
                 <Button
                   size="small"
                   startIcon={<AddIcon />}
                   onClick={() => setAddActionDialogOpen(true)}
                 >
                   Add Action
                 </Button>
              )}
            </Stack>
            
            {incident.correctiveActions.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No corrective actions recorded yet.</Typography>
            ) : (
              <Stack spacing={2}>
                {incident.correctiveActions.map((action, index) => (
                  <Box key={action.correctiveActionId}>
                    {index > 0 && <Divider sx={{ my: 1.5 }} />}
                    <Typography variant="subtitle2">{action.actionTaken}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Date: {formatDate(action.actionDate)} {action.penaltyTypeName ? `| Penalty: ${action.penaltyTypeName}` : ''}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Incident"
        message="Are you sure you want to delete this incident? This action cannot be undone."
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
      
      <Dialog open={addActionDialogOpen} onClose={() => setAddActionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Corrective Action</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(handleAddAction)}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Action Taken"
                fullWidth
                multiline
                rows={3}
                {...register('actionTaken')}
                error={!!errors.actionTaken}
                helperText={errors.actionTaken?.message}
              />
              <TextField
                select
                label="Penalty Type (Optional)"
                fullWidth
                defaultValue=""
                {...register('penaltyTypeId', { valueAsNumber: true })}
                error={!!errors.penaltyTypeId}
                helperText={errors.penaltyTypeId?.message}
              >
                <MenuItem value="">None</MenuItem>
                {penaltyTypes.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Action Date (Optional)"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                {...register('actionDate')}
                error={!!errors.actionDate}
                helperText={errors.actionDate?.message}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setAddActionDialogOpen(false); reset(); }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? 'Adding…' : 'Add'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
