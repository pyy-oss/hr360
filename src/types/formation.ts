import { z } from 'zod';

export const TrainingProvider = z.enum(['interne', 'externe']);
export const NeedStatus = z.enum(['ouvert', 'planifie', 'clos']);
export const NeedSource = z.enum(['entretien', 'matrice', 'manager', 'auto']);
export const EnrollmentStatus = z.enum(['inscrit', 'en_cours', 'termine', 'certifie', 'abandonne']);
export const PlanScope = z.enum(['org', 'dept', 'employee']);

export const TrainingNeedInput = z.object({
  employeeId: z.string().optional(),
  departmentId: z.string().min(1),
  skill: z.string().min(1),
  priority: z.enum(['basse', 'moyenne', 'haute']),
  source: NeedSource,
});
export type TrainingNeedInput = z.infer<typeof TrainingNeedInput>;

export const TrainingPlanInput = z.object({
  year: z.number().int().min(2024),
  scope: PlanScope,
  departmentId: z.string().optional(),
  items: z.array(z.object({
    catalogId: z.string().min(1),
    targetEmployees: z.array(z.string()).default([]),
    budgetIndex: z.number().nonnegative().optional(),
  })).min(1),
});
export type TrainingPlanInput = z.infer<typeof TrainingPlanInput>;

export const EnrollmentUpdateInput = z.object({
  id: z.string().min(1),
  status: EnrollmentStatus,
});
export type EnrollmentUpdateInput = z.infer<typeof EnrollmentUpdateInput>;
