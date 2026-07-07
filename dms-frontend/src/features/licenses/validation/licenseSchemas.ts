import { z } from 'zod';

export const licenseSchema = z.object({
  driverId: z.number().min(1, 'Driver is required'),
  licenseNo: z.string().min(1, 'License number is required').max(50, 'License number cannot exceed 50 characters'),
  issueDate: z.string().min(1, 'Issue date is required'),
  validTill: z.string().min(1, 'Expiry date is required'),
  vehicleTypeId: z.number().min(1, 'Vehicle type is required'),
  endorsementIds: z.array(z.number()),
});

export type LicenseFormValues = z.infer<typeof licenseSchema>;
