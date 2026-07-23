import { z } from 'zod';

// ---------- Postes (référentiel & ouvertures de poste) ----------
export const PositionLevel = z.enum(['junior', 'confirme', 'senior', 'lead', 'manager']);
export const PositionContract = z.enum(['cdi', 'cdd', 'stage', 'alternance', 'prestation']);
export const PositionStatus = z.enum(['ouvert', 'en_cours', 'pourvu', 'gele', 'annule']);

// Pondérations du score d'un poste. La somme doit valoir 100 (cohérence du référentiel).
export const PositionWeights = z.object({
  technique: z.number().int().min(0).max(100),
  experience: z.number().int().min(0).max(100),
  soft: z.number().int().min(0).max(100),
  formation: z.number().int().min(0).max(100),
}).refine((w) => w.technique + w.experience + w.soft + w.formation === 100, {
  message: 'La somme des pondérations doit valoir 100 %.',
});
export type PositionWeights = z.infer<typeof PositionWeights>;

export const PositionInput = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  departmentId: z.string().min(1),
  level: PositionLevel,
  contractType: PositionContract,
  openings: z.number().int().min(1).max(50).default(1),
  status: PositionStatus.default('ouvert'),
  description: z.string().max(2000).optional(),
  mustSkills: z.array(z.string().min(1)).max(20).default([]),
  niceSkills: z.array(z.string().min(1)).max(20).default([]),
  // Critères explicitement exclus du scoring (traçabilité ARTCI). Jamais lus par un moteur.
  excludedCriteria: z.array(z.string().min(1)).max(20).default([]),
  weights: PositionWeights.optional(),
});
export type PositionInput = z.infer<typeof PositionInput>;

// ---------- Candidats (vivier) ----------
export const CandidateSource = z.enum(['spontanee', 'site', 'cooptation', 'linkedin', 'cabinet', 'autre']);
export const CandidateStage = z.enum([
  'nouveau', 'preselection', 'entretien', 'offre', 'embauche', 'rejete', 'vivier',
]);
export type CandidateStage = z.infer<typeof CandidateStage>;

export const CandidateInput = z.object({
  id: z.string().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  source: CandidateSource,
  // Rattachement optionnel à une ouverture de poste (sinon : vivier).
  positionId: z.string().optional(),
  // Département cible dénormalisé — support des règles Firestore et des requêtes manager.
  departmentId: z.string().optional(),
  yearsExperience: z.number().min(0).max(60).default(0),
  stage: CandidateStage.default('nouveau'),
  // Score renseigné MANUELLEMENT par le recruteur (aucune IA en V2). Optionnel.
  matchScore: z.number().int().min(0).max(100).optional(),
  tags: z.array(z.string().min(1)).max(20).default([]),
  notes: z.string().max(2000).optional(),
});
export type CandidateInput = z.infer<typeof CandidateInput>;

// Transition de statut dans le pipeline (auditée côté serveur).
export const CandidateStageUpdate = z.object({
  id: z.string().min(1),
  stage: CandidateStage,
  comment: z.string().max(500).optional(),
});
export type CandidateStageUpdate = z.infer<typeof CandidateStageUpdate>;
