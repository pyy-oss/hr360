import { z } from 'zod';

export const MissionStatus = z.enum(['prospect', 'active', 'terminee', 'suspendue']);
export const AssignmentStatus = z.enum(['prevue', 'active', 'terminee']);

export const MissionInput = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  client: z.string().min(1),
  departmentId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  status: MissionStatus.default('prospect'),
});
export type MissionInput = z.infer<typeof MissionInput>;

// Affectation d'un collaborateur à une mission sur une période, avec un taux d'allocation.
export const AssignmentInput = z.object({
  id: z.string().optional(),
  missionId: z.string().min(1),
  employeeId: z.string().min(1),
  departmentId: z.string().min(1),
  allocationPct: z.number().int().min(1).max(100),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  status: AssignmentStatus.default('prevue'),
}).refine((a) => new Date(a.endDate) >= new Date(a.startDate), {
  message: 'La date de fin doit suivre la date de début.', path: ['endDate'],
});
export type AssignmentInput = z.infer<typeof AssignmentInput>;
