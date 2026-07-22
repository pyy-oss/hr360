import { z } from 'zod';

export const CampaignPhase = z.enum([
  'preparation', 'fixation', 'suivi', 'evaluation', 'cloturee',
]);
export const ObjectiveStatus = z.enum([
  'brouillon', 'valide', 'atteint', 'partiel', 'non_atteint',
]);
export const EvaluationStatus = z.enum(['en_cours', 'soumise', 'publiee']);

export const ObjectiveInput = z.object({
  campaignId: z.string().min(1),
  employeeId: z.string().min(1),
  departmentId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().max(1000).optional(),
  measure: z.string().min(1),
  weight: z.number().int().min(0).max(100),
});
export type ObjectiveInput = z.infer<typeof ObjectiveInput>;

// La somme des pondérations d'une personne doit valoir 100.
export const ObjectiveSet = z.array(ObjectiveInput).refine(
  (arr) => arr.reduce((s, o) => s + o.weight, 0) === 100,
  { message: 'La somme des pondérations doit être égale à 100.' },
);

export const AdvancePhaseInput = z.object({
  campaignId: z.string().min(1),
  toPhase: CampaignPhase,
});
export type AdvancePhaseInput = z.infer<typeof AdvancePhaseInput>;

export const PublishEvaluationInput = z.object({
  evaluationId: z.string().min(1),
});
export type PublishEvaluationInput = z.infer<typeof PublishEvaluationInput>;

export const ValidateObjectiveInput = z.object({
  objectiveId: z.string().min(1),
});
export type ValidateObjectiveInput = z.infer<typeof ValidateObjectiveInput>;
