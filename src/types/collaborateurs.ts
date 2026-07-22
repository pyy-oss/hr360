import { z } from 'zod';

export const ContractType = z.enum(['cdi', 'cdd', 'stage', 'alternance', 'prestation']);
export const SeniorityLevel = z.enum(['junior', 'confirme', 'senior', 'lead', 'manager']);
export const EmployeeStatus = z.enum(['essai', 'confirme', 'sortant']);

// Création d'un dossier collaborateur (RH/DRH). Le rattachement à un compte Auth (uid)
// est optionnel à la création et peut être lié ensuite.
export const EmployeeInput = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  departmentId: z.string().min(1),
  jobTitle: z.string().min(1),
  seniorityLevel: SeniorityLevel,
  contractType: ContractType,
  hireDate: z.string().min(1),
  managerUid: z.string().optional(),
  status: EmployeeStatus.default('essai'),
});
export type EmployeeInput = z.infer<typeof EmployeeInput>;

// Mise à jour partielle du dossier.
export const EmployeeUpdate = EmployeeInput.partial().extend({ id: z.string().min(1) });
export type EmployeeUpdate = z.infer<typeof EmployeeUpdate>;

export const DepartmentInput = z.object({
  name: z.string().min(1),
  managerUid: z.string().optional(),
});
export type DepartmentInput = z.infer<typeof DepartmentInput>;
