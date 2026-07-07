import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Button, Checkbox, FormControl, InputLabel, ListItemText, MenuItem, OutlinedInput, Paper, Select, Stack, TextField } from '@mui/material';
import { toast } from 'react-toastify';
import { PageHeader } from '@/components/PageHeader';
import { LoadingState } from '@/components/LoadingState';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createLicense, getLicense, updateLicense } from '../licensesSlice';
import { licenseSchema, LicenseFormValues } from '../validation/licenseSchemas';
import { ROUTES } from '@/constants/routes';
import { toDateInputValue } from '@/utils/dateUtils';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

export default function LicenseFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const vehicleTypes = useAppSelector((s) => s.lookups.vehicleTypes);
  const endorsementsList = useAppSelector((s) => s.lookups.endorsements);
  const drivers = useAppSelector((s) => s.drivers.items); // Assuming drivers are loaded, or could add an autocomplete search

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LicenseFormValues>({
    resolver: zodResolver(licenseSchema),
    defaultValues: {
      endorsementIds: [],
    },
  });

  const selectedEndorsementIds = watch('endorsementIds') || [];

  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      dispatch(getLicense(Number(id)))
        .unwrap()
        .then((data) => {
          reset({
            ...data,
            issueDate: toDateInputValue(data.issueDate),
            validTill: toDateInputValue(data.validTill),
            vehicleTypeId: vehicleTypes.find(v => v.name === data.vehicleTypeName)?.id || 0,
            endorsementIds: data.endorsements.map(eName => endorsementsList.find(e => e.name === eName)?.id || 0).filter(id => id !== 0),
          });
        })
        .catch(() => {
          toast.error('Failed to load license details.');
          navigate(ROUTES.LICENSES);
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, dispatch, reset, navigate, vehicleTypes, endorsementsList]);

  const onSubmit = async (values: LicenseFormValues) => {
    try {
      if (isEdit) {
        await dispatch(updateLicense({ id: Number(id), data: values })).unwrap();
        toast.success('License updated successfully');
      } else {
        await dispatch(createLicense(values)).unwrap();
        toast.success('License created successfully');
      }
      navigate(ROUTES.LICENSES);
    } catch (err: any) {
      toast.error(err || 'Failed to save license');
    }
  };

  if (loading) return <LoadingState />;

  return (
    <Box>
      <PageHeader
        title={isEdit ? 'Edit License' : 'New License'}
        breadcrumbs={[
          { label: 'Licenses', to: ROUTES.LICENSES },
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
              label="License Number"
              fullWidth
              {...register('licenseNo')}
              error={!!errors.licenseNo}
              helperText={errors.licenseNo?.message}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Issue Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                {...register('issueDate')}
                error={!!errors.issueDate}
                helperText={errors.issueDate?.message}
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
              label="Vehicle Type"
              fullWidth
              defaultValue=""
              {...register('vehicleTypeId', { valueAsNumber: true })}
              error={!!errors.vehicleTypeId}
              helperText={errors.vehicleTypeId?.message}
            >
              <MenuItem value="">Select Vehicle Type</MenuItem>
              {vehicleTypes.map((v) => (
                <MenuItem key={v.id} value={v.id}>
                  {v.name}
                </MenuItem>
              ))}
            </TextField>

            <FormControl fullWidth>
              <InputLabel id="endorsements-label">Endorsements</InputLabel>
              <Select
                labelId="endorsements-label"
                multiple
                value={selectedEndorsementIds}
                onChange={(e) => {
                  const val = e.target.value;
                  setValue('endorsementIds', typeof val === 'string' ? val.split(',').map(Number) : val as number[]);
                }}
                input={<OutlinedInput label="Endorsements" />}
                renderValue={(selected) => (selected as number[]).map(id => endorsementsList.find(e => e.id === id)?.name).join(', ')}
                MenuProps={MenuProps}
              >
                {endorsementsList.map((e) => (
                  <MenuItem key={e.id} value={e.id}>
                    <Checkbox checked={selectedEndorsementIds.indexOf(e.id) > -1} />
                    <ListItemText primary={e.name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

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
