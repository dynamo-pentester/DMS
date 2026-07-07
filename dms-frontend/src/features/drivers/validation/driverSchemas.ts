import { z } from 'zod';
import { licenseSchema } from '../../licenses/validation/licenseSchemas';
import { medicalRecordSchema } from '../../medical/validation/medicalSchemas';

export const driverSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100, 'Name cannot exceed 100 characters'),
  fatherName: z.string().max(100).nullable().optional(),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  mobile: z.string().min(10, 'Mobile must be at least 10 characters').max(15, 'Mobile cannot exceed 15 characters'),
  address: z.string().max(500).nullable().optional(),
  bloodGroupId: z.number().nullable().optional(),
  aadhaarNo: z.string().max(12).nullable().optional(), // Only for create, backend handles encryption
  emergencyContactName: z.string().max(100).nullable().optional(),
  emergencyContactRelation: z.string().max(50).nullable().optional(),
  emergencyContactPhone: z.string().max(15).nullable().optional(),
  remarks: z.string().max(500).nullable().optional(), // Only for update
  
  // Optional nested entities during creation
  license: licenseSchema.omit({ driverId: true }).optional(),
  medicalRecord: medicalRecordSchema.omit({ driverId: true }).optional(),
});

export type DriverFormValues = z.infer<typeof driverSchema>;

export const driverStatusSchema = z.object({
  newStatusId: z.number().min(1, 'Status is required'),
  reason: z.string().max(500, 'Reason cannot exceed 500 characters').nullable().optional(),
});

export type DriverStatusFormValues = z.infer<typeof driverStatusSchema>;
