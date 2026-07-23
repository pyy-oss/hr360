import { z } from 'zod';

export const PayLevel = z.enum(['junior', 'confirme', 'senior', 'lead', 'manager']);

// Bande salariale par palier (politique interne, définie par la DRH).
// Montants annuels bruts, en FCFA (XOF) par défaut.
export const SalaryBandInput = z.object({
  level: PayLevel,
  label: z.string().min(1),
  minAmount: z.number().int().min(0),
  midAmount: z.number().int().min(0),
  maxAmount: z.number().int().min(0),
  currency: z.string().min(1).default('XOF'),
}).refine((b) => b.minAmount <= b.midAmount && b.midAmount <= b.maxAmount, {
  message: 'Les montants doivent être ordonnés : min ≤ médian ≤ max.',
});
export type SalaryBandInput = z.infer<typeof SalaryBandInput>;

// Rémunération individuelle courante d'un collaborateur (donnée personnelle sensible).
// Écrite uniquement côté serveur (setCompensation), avec traçabilité d'audit.
export const CompensationInput = z.object({
  employeeId: z.string().min(1),
  departmentId: z.string().min(1),
  bandLevel: PayLevel,
  baseSalary: z.number().int().min(0),
  currency: z.string().min(1).default('XOF'),
  effectiveDate: z.string().min(1),
  // Motif de la (ré)évaluation — journalisé pour l'audit.
  reason: z.string().min(1).max(500),
});
export type CompensationInput = z.infer<typeof CompensationInput>;
