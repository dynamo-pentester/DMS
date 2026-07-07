import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Button, MenuItem, Paper, Stack, TextField } from '@mui/material';
import { toast } from 'react-toastify';
import { PageHeader } from '@/components/PageHeader';
import { LoadingState } from '@/components/LoadingState';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createTraining, getTraining, updateTraining } from '../trainingsSlice';
import { trainingSchema, TrainingFormValues } from '../validation/trainingSchemas';
import { ROUTES } from '@/constants/routes';
import { toDateInputValue } from '@/utils/dateUtils';

export default function TrainingFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const trainingTypes = useAppSelector((s) => s.lookups.trainingTypes);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TrainingFormValues>({
    resolver: zodResolver(trainingSchema),
  });

  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      dispatch(getTraining(Number(id)))
        .unwrap()
        .then((data) => {
          reset({
            ...data,
            dateCompleted: toDateInputValue(data.dateCompleted),
            validUpto: toDateInputValue(data.validUpto),
            trainingTypeId: trainingTypes.find(t => t.name === data.trainingTypeName)?.id || 0,
          });
        })
        .catch(() => {
          toast.error('Failed to load training details.');
          navigate(ROUTES.TRAININGS);
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, dispatch, reset, navigate, trainingTypes]);

  const onSubmit = async (values: TrainingFormValues) => {
    try {
      if (isEdit) {
        await dispatch(updateTraining({ id: Number(id), data: values })).unwrap();
        toast.success('Training updated successfully');
      } else {
        await dispatch(createTraining(values)).unwrap();
        toast.success('Training created successfully');
      }
      navigate(ROUTES.TRAININGS);
    } catch (err: any) {
      toast.error(err || 'Failed to save training');
    }
  };

  if (loading) return <LoadingState />;

  return (
    <Box>
      <PageHeader
        title={isEdit ? 'Edit Training' : 'New Training'}
        breadcrumbs={[
          { label: 'Trainings', to: ROUTES.TRAININGS },
          { label: isEdit ? 'Edit' : 'New' },
        ]}
      />

      <Paper sx={{ p: 4, maxWidth: 600 }}>
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

            <TextField
              select
              label="Training Type"
              fullWidth
              defaultValue=""
              {...register('trainingTypeId', { valueAsNumber: true })}
              error={!!errors.trainingTypeId}
              helperText={errors.trainingTypeId?.message}
            >
              <MenuItem value="">Select Training Type</MenuItem>
              {trainingTypes.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))}
            </TextField>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Date Completed"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                {...register('dateCompleted')}
                error={!!errors.dateCompleted}
                helperText={errors.dateCompleted?.message}
              />
              <TextField
                label="Valid Upto"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                {...register('validUpto')}
                error={!!errors.validUpto}
                helperText={errors.validUpto?.message}
              />
            </Stack>

            <TextField
              label="Trainer Name (Optional)"
              fullWidth
              {...register('trainerName')}
              error={!!errors.trainerName}
              helperText={errors.trainerName?.message}
            />

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
