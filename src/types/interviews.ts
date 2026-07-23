import { z } from 'zod';

export const InterviewMode = z.enum(['visio', 'present', 'tel']);
export const InterviewStatus = z.enum(['planifie', 'realise', 'annule', 'no_show']);

export const InterviewScheduleInput = z.object({
  candidateId: z.string().min(1),
  positionId: z.string().optional(),
  scheduledAt: z.string().min(1),          // ISO datetime
  mode: InterviewMode,
  interviewers: z.array(z.string().min(1)).max(10).optional(),
  notes: z.string().max(1000).optional(),
});
export type InterviewScheduleInput = z.infer<typeof InterviewScheduleInput>;

export const InterviewUpdateInput = z.object({
  id: z.string().min(1),
  scheduledAt: z.string().min(1).optional(),
  mode: InterviewMode.optional(),
  status: InterviewStatus.optional(),
  notes: z.string().max(1000).optional(),
});
export type InterviewUpdateInput = z.infer<typeof InterviewUpdateInput>;

export const INTERVIEW_MODE_LABEL: Record<string, string> = {
  visio: 'Visioconférence', present: 'Présentiel', tel: 'Téléphone',
};
export const INTERVIEW_STATUS_LABEL: Record<string, string> = {
  planifie: 'Planifié', realise: 'Réalisé', annule: 'Annulé', no_show: 'Absence',
};
