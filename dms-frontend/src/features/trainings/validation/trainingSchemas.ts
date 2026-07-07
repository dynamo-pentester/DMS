import { z } from 'zod';

export const trainingSchema = z.object({
  driverId: z.number().min(1, 'Driver is required'),
  trainingTypeId: z.number().min(1, 'Training type is required'),
  dateCompleted: z.string().min(1, 'Completion date is required'),
  validUpto: z.string().min(1, 'Valid upto date is required'),
  trainerName: z.string().max(100).nullable().optional(),
});

export type TrainingFormValues = z.infer<typeof trainingSchema>;
