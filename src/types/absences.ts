import { z } from 'zod';

export const LeaveType = z.enum([
  'conges_payes', 'rtt', 'maladie', 'sans_solde', 'evenement_familial', 'recuperation',
]);
export type LeaveType = z.infer<typeof LeaveType>;

export const LeaveStatus = z.enum([
  'soumis', 'valide_manager', 'approuve', 'refuse', 'annule',
]);

// Schéma partagé client (formulaire) et serveur (fonction). Source unique de vérité.
export const LeaveRequestInput = z.object({
  type: LeaveType,
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  days: z.number().positive(),
  reason: z.string().max(500).optional(),
}).refine((d) => new Date(d.endDate) >= new Date(d.startDate), {
  message: 'La date de fin doit suivre la date de début.', path: ['endDate'],
});
export type LeaveRequestInput = z.infer<typeof LeaveRequestInput>;
