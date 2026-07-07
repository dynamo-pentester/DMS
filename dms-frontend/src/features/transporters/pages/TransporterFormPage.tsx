import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Button, FormControlLabel, Paper, Stack, Switch, TextField } from '@mui/material';
import { toast } from 'react-toastify';
import { PageHeader } from '@/components/PageHeader';
import { LoadingState } from '@/components/LoadingState';
import { useAppDispatch } from '@/store/hooks';
import { createTransporter, getTransporter, updateTransporter } from '../transportersSlice';
import { transporterSchema, TransporterFormValues } from '../validation/transporterSchemas';
import { ROUTES } from '@/constants/routes';
import { toDateInputValue } from '@/utils/dateUtils';

export default function TransporterFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TransporterFormValues>({
    resolver: zodResolver(transporterSchema),
    defaultValues: {
      isActive: true,
    }
  });

  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      dispatch(getTransporter(Number(id)))
        .unwrap()
        .then((data) => {
          reset({
            ...data,
            agreementValidTill: toDateInputValue(data.agreementValidTill),
          });
        })
        .catch(() => {
          toast.error('Failed to load transporter details.');
          navigate(ROUTES.TRANSPORTERS);
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, dispatch, reset, navigate]);

  const onSubmit = async (values: TransporterFormValues) => {
    try {
      if (isEdit) {
        await dispatch(updateTransporter({ id: Number(id), data: values })).unwrap();
        toast.success('Transporter updated successfully');
      } else {
        const res = await dispatch(createTransporter(values)).unwrap();
        toast.success('Transporter created successfully');
        navigate(ROUTES.TRANSPORTER_DETAILS(res.transporterId));
        return;
      }
      navigate(ROUTES.TRANSPORTER_DETAILS(Number(id)));
    } catch (err: any) {
      toast.error(err || 'Failed to save transporter');
    }
  };

  if (loading) return <LoadingState />;

  return (
    <Box>
      <PageHeader
        title={isEdit ? 'Edit Transporter' : 'New Transporter'}
        breadcrumbs={[
          { label: 'Transporters', to: ROUTES.TRANSPORTERS },
          { label: isEdit ? 'Edit' : 'New' },
        ]}
      />

      <Paper sx={{ p: 4, maxWidth: 600 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack spacing={3}>
            
            <TextField
              label="Transporter Name"
              fullWidth
              {...register('name')}
              error={!!errors.name}
              helperText={errors.name?.message}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Contact Person (Optional)"
                fullWidth
                {...register('contactPerson')}
                error={!!errors.contactPerson}
                helperText={errors.contactPerson?.message}
              />
              <TextField
                label="Mobile (Optional)"
                fullWidth
                {...register('mobile')}
                error={!!errors.mobile}
                helperText={errors.mobile?.message}
              />
            </Stack>

            <TextField
              label="Address (Optional)"
              multiline
              rows={3}
              fullWidth
              {...register('address')}
              error={!!errors.address}
              helperText={errors.address?.message}
            />

            <TextField
              label="Agreement Valid Till (Optional)"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              {...register('agreementValidTill')}
              error={!!errors.agreementValidTill}
              helperText={errors.agreementValidTill?.message}
            />
            
            {isEdit && (
               <Controller
                 name="isActive"
                 control={control}
                 render={({ field }) => (
                   <FormControlLabel
                     control={<Switch checked={field.value} onChange={field.onChange} />}
                     label="Is Active"
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
