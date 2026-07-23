import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  collection, query, where, limit, getDocs, doc, getDoc,
} from 'firebase/firestore';
import { callable, db } from '@/lib/firebase';
import { useAuth } from '@/auth/AuthProvider';
import type { EmployeeInput, EmployeeUpdate, DepartmentInput } from '@/types';

const upsertEmployeeFn = callable('upsertEmployee');
const upsertDepartmentFn = callable('upsertDepartment');
const linkAccountFn = callable('linkEmployeeAccount');

export interface EmployeeRow {
  id: string; firstName: string; lastName: string; email: string;
  departmentId: string; jobTitle: string; seniorityLevel: string;
  contractType: string; status: string; uid?: string | null;
}

/**
 * Annuaire. RH/DRH/lecture voient toute l'organisation ; un manager ne peut lister
 * que son propre département (les règles Firestore l'imposent, la requête s'y aligne).
 */
export function useDirectory(departmentFilter?: string) {
  const { orgId, role, departmentId } = useAuth();
  const scopedDept =
    role === 'manager' ? departmentId : (departmentFilter || undefined);

  return useQuery<EmployeeRow[]>({
    queryKey: ['directory', orgId, scopedDept ?? 'all'],
    enabled: !!orgId,
    queryFn: async () => {
      // Toute requête liste DOIT être scopée à l'organisation : les règles Firestore
      // exigent sameOrg, et sans ce filtre la requête est rejetée en bloc (projet partagé).
      const base = collection(db, 'employees');
      const q = scopedDept
        ? query(base, where('orgId', '==', orgId), where('departmentId', '==', scopedDept), limit(200))
        : query(base, where('orgId', '==', orgId), limit(200));
      const snap = await getDocs(q);
      return snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<EmployeeRow, 'id'>) }))
        .sort((a, b) => a.lastName.localeCompare(b.lastName));
    },
  });
}

export function useEmployee(id?: string) {
  return useQuery<EmployeeRow | null>({
    queryKey: ['employee', id],
    enabled: !!id,
    queryFn: async () => {
      const snap = await getDoc(doc(db, 'employees', id!));
      return snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<EmployeeRow, 'id'>) }) : null;
    },
  });
}

export function useDepartments() {
  const { orgId } = useAuth();
  return useQuery({
    queryKey: ['departments', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, 'departments'), where('orgId', '==', orgId), limit(100)));
      return snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as { name: string }) }))
        .sort((a, b) => a.name.localeCompare(b.name));
    },
  });
}

export function useUpsertEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: EmployeeInput | EmployeeUpdate) => upsertEmployeeFn(input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['directory'] }); qc.invalidateQueries({ queryKey: ['employee'] }); },
  });
}
export function useUpsertDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DepartmentInput & { id?: string }) => upsertDepartmentFn(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  });
}
export function useLinkAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { employeeId: string; uid: string }) => linkAccountFn(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employee'] }),
  });
}
