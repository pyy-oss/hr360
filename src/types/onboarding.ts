import { z } from 'zod';

export const OnboardingStatus = z.enum(['en_cours', 'termine']);

export const OnboardingStartInput = z.object({
  employeeId: z.string().min(1),
  departmentId: z.string().min(1),
  startDate: z.string().min(1),
  notes: z.string().max(1000).optional(),
});
export type OnboardingStartInput = z.infer<typeof OnboardingStartInput>;

export const OnboardingTaskUpdate = z.object({
  id: z.string().min(1),
  taskKey: z.string().min(1),
  done: z.boolean(),
});
export type OnboardingTaskUpdate = z.infer<typeof OnboardingTaskUpdate>;

export const OnboardingCloseInput = z.object({ id: z.string().min(1) });
export type OnboardingCloseInput = z.infer<typeof OnboardingCloseInput>;

// Décision de période d'essai (confirme ou non le collaborateur).
export const ProbationOutcome = z.enum(['confirme', 'non_confirme']);
export const ProbationDecisionInput = z.object({
  employeeId: z.string().min(1),
  outcome: ProbationOutcome,
  note: z.string().max(1000).optional(),
});
export type ProbationDecisionInput = z.infer<typeof ProbationDecisionInput>;

// Checklist d'intégration par défaut (référence partagée UI/serveur).
export const ONBOARDING_TASKS: { key: string; label: string }[] = [
  { key: 'poste_travail', label: 'Poste de travail & équipement prêts' },
  { key: 'comptes_si', label: 'Création des comptes SI & accès' },
  { key: 'badge', label: "Badge d'accès remis" },
  { key: 'parrain', label: 'Parrain/marraine désigné(e)' },
  { key: 'dossier_admin', label: 'Dossier administratif complété' },
  { key: 'presentation_equipe', label: "Présentation à l'équipe" },
  { key: 'objectifs_essai', label: "Objectifs de période d'essai fixés" },
  { key: 'point_j30', label: 'Point à 30 jours planifié' },
];
