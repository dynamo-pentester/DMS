import { z } from 'zod';

export const transporterSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name cannot exceed 200 characters'),
  contactPerson: z.string().max(100).nullable().optional(),
  mobile: z.string().max(20).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  agreementValidTill: z.string().nullable().optional(),
  isActive: z.boolean().default(true), // Update only, but safe here
});

export type TransporterFormValues = z.infer<typeof transporterSchema>;

export const assignDriverSchema = z.object({
  driverId: z.number().min(1, 'Driver is required'),
  assignmentDate: z.string().nullable().optional(),
});

export type AssignDriverFormValues = z.infer<typeof assignDriverSchema>;
