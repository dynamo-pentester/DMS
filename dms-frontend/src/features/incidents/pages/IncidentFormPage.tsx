import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Button, FormControlLabel, MenuItem, Paper, Stack, Switch, TextField } from '@mui/material';
import { toast } from 'react-toastify';
import { PageHeader } from '@/components/PageHeader';
import { LoadingState } from '@/components/LoadingState';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createIncident, getIncident, updateIncident } from '../incidentsSlice';
import { incidentSchema, IncidentFormValues } from '../validation/incidentSchemas';
import { ROUTES } from '@/constants/routes';
import { toDateInputValue } from '@/utils/dateUtils';

export default function IncidentFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const incidentTypes = useAppSelector((s) => s.lookups.incidentTypes);
  const severityLevels = useAppSelector((s) => s.lookups.severityLevels);
  
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      rootCauseCompleted: false,
    }
  });

  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      dispatch(getIncident(Number(id)))
        .unwrap()
        .then((data) => {
          reset({
            ...data,
            incidentDate: toDateInputValue(data.incidentDate),
            incidentTypeId: incidentTypes.find(t => t.name === data.incidentTypeName)?.id || 0,
            severityLevelId: severityLevels.find(s => s.name === data.severityLevelName)?.id || 0,
          });
        })
        .catch(() => {
          toast.error('Failed to load incident details.');
          navigate(ROUTES.INCIDENTS);
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, dispatch, reset, navigate, incidentTypes, severityLevels]);

  const onSubmit = async (values: IncidentFormValues) => {
    try {
      if (isEdit) {
        await dispatch(updateIncident({ id: Number(id), data: values })).unwrap();
        toast.success('Incident updated successfully');
      } else {
        const res = await dispatch(createIncident(values)).unwrap();
        toast.success('Incident reported successfully');
        navigate(ROUTES.INCIDENT_DETAILS(res.incidentId));
        return;
      }
      navigate(ROUTES.INCIDENT_DETAILS(Number(id)));
    } catch (err: any) {
      toast.error(err || 'Failed to save incident');
    }
  };

  if (loading) return <LoadingState />;

  return (
    <Box>
      <PageHeader
        title={isEdit ? 'Edit Incident' : 'Report Incident'}
        breadcrumbs={[
          { label: 'Incidents', to: ROUTES.INCIDENTS },
          { label: isEdit ? 'Edit' : 'New' },
        ]}
      />

      <Paper sx={{ p: 4, maxWidth: 800 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack spacing={3}>
            
            <TextField
              label="Driver ID"
              type="number"
              fullWidth
              disabled={isEdit}
              {...register('driverId', { valueAsNumber: true })}
              error={!!errors.driverId}
              helperText={errors.driverId?.message}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Incident Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                {...register('incidentDate')}
                error={!!errors.incidentDate}
                helperText={errors.incidentDate?.message}
              />
              
              <TextField
                select
                label="Incident Type"
                fullWidth
                defaultValue=""
                {...register('incidentTypeId', { valueAsNumber: true })}
                error={!!errors.incidentTypeId}
                helperText={errors.incidentTypeId?.message}
              >
                <MenuItem value="">Select Incident Type</MenuItem>
                {incidentTypes.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                select
                label="Severity Level"
                fullWidth
                defaultValue=""
                {...register('severityLevelId', { valueAsNumber: true })}
                error={!!errors.severityLevelId}
                helperText={errors.severityLevelId?.message}
              >
                <MenuItem value="">Select Severity Level</MenuItem>
                {severityLevels.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </TextField>
              
              <TextField
                label="Location (Optional)"
                fullWidth
                {...register('location')}
                error={!!errors.location}
                helperText={errors.location?.message}
              />
            </Stack>

            <TextField
              label="Description"
              multiline
              rows={4}
              fullWidth
              {...register('description')}
              error={!!errors.description}
              helperText={errors.description?.message}
            />
            
            {isEdit && (
               <Controller
                 name="rootCauseCompleted"
                 control={control}
                 render={({ field }) => (
                   <FormControlLabel
                     control={<Switch checked={field.value} onChange={field.onChange} />}
                     label="Root Cause Analysis Completed"
                   />
                 )}
               />
            )}

            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
              <Button onClick={() => navigate(-1)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Save'}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
