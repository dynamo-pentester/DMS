import { z } from 'zod';

export const medicalRecordSchema = z.object({
  driverId: z.number().min(1, 'Driver is required'),
  examDate: z.string().min(1, 'Exam date is required'),
  fitnessStatusId: z.number().min(1, 'Fitness status is required'),
  bp: z.string().max(20).nullable().optional(),
  visionTestPass: z.boolean(),
  alcoholTestPass: z.boolean(),
  chronicIllness: z.boolean(),
  chronicIllnessRemarks: z.string().max(500).nullable().optional(),
  validTill: z.string().min(1, 'Valid till date is required'),
});

export type MedicalRecordFormValues = z.infer<typeof medicalRecordSchema>;
