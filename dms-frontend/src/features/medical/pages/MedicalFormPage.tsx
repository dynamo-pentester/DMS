import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Button, FormControlLabel, MenuItem, Paper, Stack, Switch, TextField, Typography } from '@mui/material';
import { toast } from 'react-toastify';
import { PageHeader } from '@/components/PageHeader';
import { LoadingState } from '@/components/LoadingState';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createMedicalRecord, getMedicalRecord, updateMedicalRecord } from '../medicalSlice';
import { medicalRecordSchema, MedicalRecordFormValues } from '../validation/medicalSchemas';
import { ROUTES } from '@/constants/routes';
import { toDateInputValue } from '@/utils/dateUtils';

export default function MedicalFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const fitnessStatuses = useAppSelector((s) => s.lookups.fitnessStatuses);
  
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MedicalRecordFormValues>({
    resolver: zodResolver(medicalRecordSchema),
    defaultValues: {
      visionTestPass: true,
      alcoholTestPass: true,
      chronicIllness: false,
    },
  });

  const chronicIllness = watch('chronicIllness');

  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      dispatch(getMedicalRecord(Number(id)))
        .unwrap()
        .then((data) => {
          reset({
            ...data,
            examDate: toDateInputValue(data.examDate),
            validTill: toDateInputValue(data.validTill),
            fitnessStatusId: fitnessStatuses.find(f => f.name === data.fitnessStatusName)?.id || 0,
          });
        })
        .catch(() => {
          toast.error('Failed to load medical record.');
          navigate(ROUTES.MEDICAL);
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, dispatch, reset, navigate, fitnessStatuses]);

  const onSubmit = async (values: MedicalRecordFormValues) => {
    try {
      if (isEdit) {
        await dispatch(updateMedicalRecord({ id: Number(id), data: values })).unwrap();
        toast.success('Medical record updated successfully');
      } else {
        await dispatch(createMedicalRecord(values)).unwrap();
        toast.success('Medical record created successfully');
      }
      navigate(ROUTES.MEDICAL);
    } catch (err: any) {
      toast.error(err || 'Failed to save medical record');
    }
  };

  if (loading) return <LoadingState />;

  return (
    <Box>
      <PageHeader
        title={isEdit ? 'Edit Medical Record' : 'New Medical Record'}
        breadcrumbs={[
          { label: 'Medical Records', to: ROUTES.MEDICAL },
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

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Exam Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                {...register('examDate')}
                error={!!errors.examDate}
                helperText={errors.examDate?.message}
              />
              <TextField
                label="Valid Till"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                {...register('validTill')}
                error={!!errors.validTill}
                helperText={errors.validTill?.message}
              />
            </Stack>

            <TextField
              select
              label="Fitness Status"
              fullWidth
              defaultValue=""
              {...register('fitnessStatusId', { valueAsNumber: true })}
              error={!!errors.fitnessStatusId}
              helperText={errors.fitnessStatusId?.message}
            >
              <MenuItem value="">Select Fitness Status</MenuItem>
              {fitnessStatuses.map((f) => (
                <MenuItem key={f.id} value={f.id}>
                  {f.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Blood Pressure (Optional)"
              fullWidth
              {...register('bp')}
              error={!!errors.bp}
              helperText={errors.bp?.message}
            />

            <Typography variant="subtitle2" sx={{ mt: 2 }}>Tests</Typography>
            <Stack direction="row" spacing={4}>
              <Controller
                name="visionTestPass"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={field.onChange} />}
                    label="Vision Test Passed"
                  />
                )}
              />
              <Controller
                name="alcoholTestPass"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={field.onChange} />}
                    label="Alcohol Test Passed"
                  />
                )}
              />
            </Stack>

            <Controller
              name="chronicIllness"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={field.onChange} />}
                  label="Has Chronic Illness"
                />
              )}
            />

            {chronicIllness && (
              <TextField
                label="Chronic Illness Remarks"
                multiline
                rows={2}
                fullWidth
                {...register('chronicIllnessRemarks')}
                error={!!errors.chronicIllnessRemarks}
                helperText={errors.chronicIllnessRemarks?.message}
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
