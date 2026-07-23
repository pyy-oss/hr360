export * from './absences';
export * from './formation';
export * from './objectifs';
export * from './collaborateurs';
export * from './staffing';
export * from './recrutement';
export * from './remuneration';

export interface Employee {
  id: string; orgId: string; uid: string;
  firstName: string; lastName: string;
  departmentId: string; jobTitle: string;
  status: 'essai' | 'confirme' | 'sortant';
}
