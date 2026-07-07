import { z } from 'zod';

export const plantMovementSchema = z.object({
  driverId: z.number().min(1, 'Driver is required'),
  vehicleNo: z.string().min(1, 'Vehicle number is required').max(50, 'Vehicle number cannot exceed 50 characters'),
  dateOfEntry: z.string().nullable().optional(), // Optional since it defaults to now on backend if null
  purposeTypeId: z.number().min(1, 'Purpose is required'),
  gateNumberId: z.number().min(1, 'Gate number is required'),
});

export type PlantMovementFormValues = z.infer<typeof plantMovementSchema>;

export const recordExitSchema = z.object({
  dateOfExit: z.string().nullable().optional(),
});

export type RecordExitFormValues = z.infer<typeof recordExitSchema>;
