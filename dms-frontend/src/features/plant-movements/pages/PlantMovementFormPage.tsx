import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Box, Button, MenuItem, Paper, Stack, TextField } from '@mui/material';
import { toast } from 'react-toastify';
import { PageHeader } from '@/components/PageHeader';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { recordEntry } from '../plantMovementsSlice';
import { plantMovementSchema, PlantMovementFormValues } from '../validation/plantMovementSchemas';
import { ROUTES } from '@/constants/routes';

export default function PlantMovementFormPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const purposeTypes = useAppSelector((s) => s.lookups.purposeTypes);
  const gateNumbers = useAppSelector((s) => s.lookups.gateNumbers);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PlantMovementFormValues>({
    resolver: zodResolver(plantMovementSchema),
  });

  const onSubmit = async (values: PlantMovementFormValues) => {
    try {
      await dispatch(recordEntry(values)).unwrap();
      toast.success('Entry recorded successfully');
      navigate(ROUTES.PLANT_MOVEMENTS);
    } catch (err: any) {
      toast.error(err || 'Failed to record entry');
    }
  };

  return (
    <Box>
      <PageHeader
        title="Record Plant Entry"
        breadcrumbs={[
          { label: 'Plant Movements', to: ROUTES.PLANT_MOVEMENTS },
          { label: 'New Entry' },
        ]}
      />

      <Paper sx={{ p: 4, maxWidth: 600 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack spacing={3}>
            
            <TextField
              label="Driver ID"
              type="number"
              fullWidth
              {...register('driverId', { valueAsNumber: true })}
              error={!!errors.driverId}
              helperText={errors.driverId?.message}
            />

            <TextField
              label="Vehicle Number"
              fullWidth
              {...register('vehicleNo')}
              error={!!errors.vehicleNo}
              helperText={errors.vehicleNo?.message}
            />
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                select
                label="Gate Number"
                fullWidth
                defaultValue=""
                {...register('gateNumberId', { valueAsNumber: true })}
                error={!!errors.gateNumberId}
                helperText={errors.gateNumberId?.message}
              >
                <MenuItem value="">Select Gate</MenuItem>
                {gateNumbers.map((g) => (
                  <MenuItem key={g.id} value={g.id}>
                    {g.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Purpose"
                fullWidth
                defaultValue=""
                {...register('purposeTypeId', { valueAsNumber: true })}
                error={!!errors.purposeTypeId}
                helperText={errors.purposeTypeId?.message}
              >
                <MenuItem value="">Select Purpose</MenuItem>
                {purposeTypes.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <TextField
              label="Date of Entry (Leave blank for now)"
              type="datetime-local"
              fullWidth
              InputLabelProps={{ shrink: true }}
              {...register('dateOfEntry')}
              error={!!errors.dateOfEntry}
              helperText={errors.dateOfEntry?.message}
            />

            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
              <Button onClick={() => navigate(-1)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {isSubmitting ? 'Recording…' : 'Record Entry'}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
