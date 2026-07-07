import { z } from 'zod';

export const incidentSchema = z.object({
  driverId: z.number().min(1, 'Driver is required'),
  incidentDate: z.string().min(1, 'Incident date is required'),
  incidentTypeId: z.number().min(1, 'Incident type is required'),
  severityLevelId: z.number().min(1, 'Severity level is required'),
  description: z.string().min(1, 'Description is required').max(1000, 'Description cannot exceed 1000 characters'),
  location: z.string().max(200).nullable().optional(),
  rootCauseCompleted: z.boolean().default(false), // Only applicable for updates, but safe to include
});

export type IncidentFormValues = z.infer<typeof incidentSchema>;

export const correctiveActionSchema = z.object({
  actionTaken: z.string().min(1, 'Action taken is required').max(500, 'Action taken cannot exceed 500 characters'),
  penaltyTypeId: z.number().nullable().optional(),
  actionDate: z.string().nullable().optional(),
});

export type CorrectiveActionFormValues = z.infer<typeof correctiveActionSchema>;
