import { z } from 'zod';

export const OffboardingReason = z.enum([
  'demission', 'licenciement', 'fin_cdd', 'rupture_conventionnelle', 'retraite', 'autre',
]);
export const OffboardingStatus = z.enum(['en_cours', 'cloture']);

export const OffboardingStartInput = z.object({
  employeeId: z.string().min(1),
  departmentId: z.string().min(1),
  reason: OffboardingReason,
  lastDay: z.string().min(1),
  notes: z.string().max(1000).optional(),
});
export type OffboardingStartInput = z.infer<typeof OffboardingStartInput>;

export const OffboardingTaskUpdate = z.object({
  id: z.string().min(1),
  taskKey: z.string().min(1),
  done: z.boolean(),
});
export type OffboardingTaskUpdate = z.infer<typeof OffboardingTaskUpdate>;

export const OffboardingCloseInput = z.object({ id: z.string().min(1) });
export type OffboardingCloseInput = z.infer<typeof OffboardingCloseInput>;

// Checklist de sortie par défaut (référence partagée UI/serveur).
export const OFFBOARDING_TASKS: { key: string; label: string }[] = [
  { key: 'revocation_acces', label: 'Révocation des accès SI & comptes' },
  { key: 'restitution_materiel', label: 'Restitution du matériel' },
  { key: 'badge', label: "Restitution du badge d'accès" },
  { key: 'passation', label: 'Passation des missions & dossiers' },
  { key: 'entretien_sortie', label: 'Entretien de sortie réalisé' },
  { key: 'solde_tout_compte', label: 'Solde de tout compte' },
  { key: 'documents_fin', label: 'Documents de fin de contrat remis' },
];
