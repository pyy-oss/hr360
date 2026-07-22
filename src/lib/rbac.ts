// RBAC côté client — CONFORT UX UNIQUEMENT. La sécurité réelle est côté serveur
// (firestore.rules + Cloud Functions). Ne jamais s'y fier pour protéger une donnée.
export type Role = 'super_admin' | 'drh' | 'rh' | 'manager' | 'collaborateur' | 'lecture';
export type Action = 'read' | 'create' | 'update' | 'delete' | 'approve';
export type Resource =
  | 'employees' | 'leaveRequests' | 'trainingPlans' | 'objectives'
  | 'evaluations' | 'campaigns' | 'settings' | 'auditLogs';

// Matrice simplifiée alignée sur docs/03-rbac.md (les nuances own/dept sont revalidées serveur).
const MATRIX: Record<Role, Partial<Record<Resource, Action[]>>> = {
  super_admin: { employees:['read','create','update','delete'], leaveRequests:['read','create','update','delete','approve'], trainingPlans:['read','create','update','delete'], objectives:['read','create','update','delete'], evaluations:['read','create','update','delete'], campaigns:['read','create','update','delete'], settings:['read','create','update','delete'], auditLogs:['read'] },
  drh:         { employees:['read','create','update','delete'], leaveRequests:['read','create','update','delete','approve'], trainingPlans:['read','create','update','delete'], objectives:['read','create','update','delete'], evaluations:['read','create','update','delete'], campaigns:['read','create','update','delete'], settings:['read','update'], auditLogs:['read'] },
  rh:          { employees:['read','create','update'], leaveRequests:['read','update','approve'], trainingPlans:['read','create','update'], objectives:['read','update'], evaluations:['read','update'], campaigns:['read'] },
  manager:     { employees:['read'], leaveRequests:['read','approve'], trainingPlans:['read','create','update'], objectives:['read','create','update'], evaluations:['read','create','update'], campaigns:['read'] },
  collaborateur:{ employees:['read'], leaveRequests:['read','create'], trainingPlans:['read'], objectives:['read','update'], evaluations:['read'], campaigns:['read'] },
  lecture:     { employees:['read'], leaveRequests:['read'], trainingPlans:['read'], objectives:['read'], evaluations:['read'], campaigns:['read'], auditLogs:['read'] },
};

export function can(role: Role | undefined, resource: Resource, action: Action): boolean {
  if (!role) return false;
  return MATRIX[role]?.[resource]?.includes(action) ?? false;
}
