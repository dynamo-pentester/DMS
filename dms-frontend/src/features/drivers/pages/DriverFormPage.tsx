import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Button, MenuItem, Paper, Stack, TextField, Typography, Divider, Checkbox, FormControlLabel, Select, InputLabel, FormControl, OutlinedInput } from '@mui/material';
import { licensesService } from '../../licenses/licensesService';
import { medicalService } from '../../medical/medicalService';
import { toast } from 'react-toastify';
import { PageHeader } from '@/components/PageHeader';
import { LoadingState } from '@/components/LoadingState';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createDriver, getDriver, updateDriver } from '../driversSlice';
import { driverSchema, DriverFormValues } from '../validation/driverSchemas';
import { ROUTES } from '@/constants/routes';
import { toDateInputValue } from '@/utils/dateUtils';

export default function DriverFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const bloodGroups = useAppSelector((s) => s.lookups.bloodGroups);
  const vehicleTypes = useAppSelector((s) => s.lookups.vehicleTypes);
  const endorsements = useAppSelector((s) => s.lookups.endorsements);
  const fitnessStatuses = useAppSelector((s) => s.lookups.fitnessStatuses);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      bloodGroupId: undefined,
      aadhaarNo: '',
      remarks: '',
    },
  });

  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      dispatch(getDriver(Number(id)))
        .unwrap()
        .then((data) => {
          reset({
            ...data,
            dateOfBirth: toDateInputValue(data.dateOfBirth),
            bloodGroupId: data.bloodGroupName ? bloodGroups.find(b => b.name === data.bloodGroupName)?.id : undefined,
          });
        })
        .catch(() => {
          toast.error('Failed to load driver details.');
          navigate(ROUTES.DRIVERS);
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, dispatch, reset, navigate, bloodGroups]);

  const onSubmit = async (values: DriverFormValues) => {
    try {
      if (isEdit) {
        await dispatch(updateDriver({ id: Number(id), data: values })).unwrap();
        toast.success('Driver updated successfully');
      } else {
        const res = await dispatch(createDriver(values as any)).unwrap();
        
        if (values.license && values.license.licenseNo) {
          try {
            await licensesService.create({ ...values.license, driverId: res.driverId } as any);
          } catch (e) { toast.error('Failed to save license details'); }
        }

        if (values.medicalRecord && values.medicalRecord.examDate) {
          try {
            await medicalService.create({ ...values.medicalRecord, driverId: res.driverId } as any);
          } catch (e) { toast.error('Failed to save medical details'); }
        }

        toast.success('Driver created successfully');
        navigate(ROUTES.DRIVER_DETAILS(res.driverId));
        return;
      }
      navigate(ROUTES.DRIVERS);
    } catch (err: any) {
      toast.error(err || 'Failed to save driver');
    }
  };

  if (loading) return <LoadingState />;

  return (
    <Box>
      <PageHeader
        title={isEdit ? 'Edit Driver' : 'New Driver'}
        breadcrumbs={[
          { label: 'Drivers', to: ROUTES.DRIVERS },
          { label: isEdit ? 'Edit' : 'New' },
        ]}
      />

      <Paper sx={{ p: 4, maxWidth: 800 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack spacing={3}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Full Name"
                fullWidth
                {...register('fullName')}
                error={!!errors.fullName}
                helperText={errors.fullName?.message}
              />
              <TextField
                label="Father's Name"
                fullWidth
                {...register('fatherName')}
                error={!!errors.fatherName}
                helperText={errors.fatherName?.message}
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Date of Birth"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                {...register('dateOfBirth')}
                error={!!errors.dateOfBirth}
                helperText={errors.dateOfBirth?.message}
              />
              <TextField
                label="Mobile"
                fullWidth
                {...register('mobile')}
                error={!!errors.mobile}
                helperText={errors.mobile?.message}
              />
            </Stack>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                select
                label="Blood Group"
                fullWidth
                defaultValue=""
                {...register('bloodGroupId', { valueAsNumber: true })}
                error={!!errors.bloodGroupId}
                helperText={errors.bloodGroupId?.message}
              >
                <MenuItem value="">None</MenuItem>
                {bloodGroups.map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.name}
                  </MenuItem>
                ))}
              </TextField>

              {!isEdit && (
                <TextField
                  label="Aadhaar No (Optional)"
                  fullWidth
                  {...register('aadhaarNo')}
                  error={!!errors.aadhaarNo}
                  helperText={errors.aadhaarNo?.message}
                />
              )}
            </Stack>

            <TextField
              label="Address"
              multiline
              rows={2}
              fullWidth
              {...register('address')}
              error={!!errors.address}
              helperText={errors.address?.message}
            />

            <Typography variant="h3" sx={{ mt: 2, mb: 1 }}>
              Emergency Contact
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Contact Name"
                fullWidth
                {...register('emergencyContactName')}
                error={!!errors.emergencyContactName}
                helperText={errors.emergencyContactName?.message}
              />
              <TextField
                label="Relation"
                fullWidth
                {...register('emergencyContactRelation')}
                error={!!errors.emergencyContactRelation}
                helperText={errors.emergencyContactRelation?.message}
              />
              <TextField
                label="Contact Phone"
                fullWidth
                {...register('emergencyContactPhone')}
                error={!!errors.emergencyContactPhone}
                helperText={errors.emergencyContactPhone?.message}
              />
            </Stack>


            {!isEdit && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h3" sx={{ mb: 1 }}>
                  License Details (Optional)
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Document upload is not supported by the current backend API, so only the license and medical record fields below are captured.
                  </Typography>
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="License No"
                    fullWidth
                    {...register('license.licenseNo')}
                    error={!!errors.license?.licenseNo}
                    helperText={errors.license?.licenseNo?.message}
                  />
                  <TextField
                    label="Issue Date"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    {...register('license.issueDate')}
                    error={!!errors.license?.issueDate}
                    helperText={errors.license?.issueDate?.message}
                  />
                  <TextField
                    label="Valid Till"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    {...register('license.validTill')}
                    error={!!errors.license?.validTill}
                    helperText={errors.license?.validTill?.message}
                  />
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    select
                    label="Vehicle Type"
                    fullWidth
                    defaultValue=""
                    {...register('license.vehicleTypeId', { valueAsNumber: true })}
                    error={!!errors.license?.vehicleTypeId}
                    helperText={errors.license?.vehicleTypeId?.message}
                  >
                    <MenuItem value="">None</MenuItem>
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
                      native
                      {...register('license.endorsementIds', {
                         setValueAs: (value) => {
                           if (!value) return [];
                           if (Array.isArray(value)) return value.map(Number);
                           return [Number(value)];
                         }
                      })}
                      input={<OutlinedInput label="Endorsements" />}
                    >
                      {endorsements.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>

                <Divider sx={{ my: 2 }} />
                <Typography variant="h3" sx={{ mb: 1 }}>
                  Medical & Fitness Details (Optional)
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Exam Date"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    {...register('medicalRecord.examDate')}
                    error={!!errors.medicalRecord?.examDate}
                    helperText={errors.medicalRecord?.examDate?.message}
                  />
                  <TextField
                    label="Valid Till"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    {...register('medicalRecord.validTill')}
                    error={!!errors.medicalRecord?.validTill}
                    helperText={errors.medicalRecord?.validTill?.message}
                  />
                  <TextField
                    select
                    label="Fitness Status"
                    fullWidth
                    defaultValue=""
                    {...register('medicalRecord.fitnessStatusId', { valueAsNumber: true })}
                    error={!!errors.medicalRecord?.fitnessStatusId}
                    helperText={errors.medicalRecord?.fitnessStatusId?.message}
                  >
                    <MenuItem value="">None</MenuItem>
                    {fitnessStatuses.map((f) => (
                      <MenuItem key={f.id} value={f.id}>
                        {f.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Blood Pressure"
                    fullWidth
                    {...register('medicalRecord.bp')}
                    error={!!errors.medicalRecord?.bp}
                    helperText={errors.medicalRecord?.bp?.message}
                  />
                  <FormControlLabel
                    control={<Checkbox {...register('medicalRecord.visionTestPass')} />}
                    label="Vision Test Pass"
                  />
                  <FormControlLabel
                    control={<Checkbox {...register('medicalRecord.alcoholTestPass')} />}
                    label="Alcohol Test Pass"
                  />
                  <FormControlLabel
                    control={<Checkbox {...register('medicalRecord.chronicIllness')} />}
                    label="Chronic Illness"
                  />
                </Stack>
                <TextField
                  label="Chronic Illness Remarks"
                  multiline
                  rows={2}
                  fullWidth
                  {...register('medicalRecord.chronicIllnessRemarks')}
                  error={!!errors.medicalRecord?.chronicIllnessRemarks}
                  helperText={errors.medicalRecord?.chronicIllnessRemarks?.message}
                />
              </>
            )}
            {isEdit && (
              <TextField
                label="Remarks"
                multiline
                rows={2}
                fullWidth
                {...register('remarks')}
                error={!!errors.remarks}
                helperText={errors.remarks?.message}
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
