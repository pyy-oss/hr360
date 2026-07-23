import { z } from 'zod';

export const EngagementQuestion = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
});
export type EngagementQuestion = z.infer<typeof EngagementQuestion>;

export const CreateSurveyInput = z.object({
  title: z.string().min(1),
  questions: z.array(EngagementQuestion).min(1).max(15),
});
export type CreateSurveyInput = z.infer<typeof CreateSurveyInput>;

// Réponse à une enquête : une note 1–5 par question. Anonyme (aucune identité stockée).
export const SubmitResponseInput = z.object({
  surveyId: z.string().min(1),
  scores: z.record(z.string(), z.number().int().min(1).max(5)),
});
export type SubmitResponseInput = z.infer<typeof SubmitResponseInput>;

// Questions pulse par défaut (référence partagée).
export const DEFAULT_PULSE_QUESTIONS: EngagementQuestion[] = [
  { key: 'sens', label: 'Sens & fierté' },
  { key: 'management', label: 'Management de proximité' },
  { key: 'charge', label: 'Charge de travail' },
  { key: 'perspectives', label: "Perspectives d'évolution" },
  { key: 'reco', label: 'Je recommanderais Neurones comme employeur' },
];
