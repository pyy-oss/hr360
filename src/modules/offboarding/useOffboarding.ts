import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { functions, db } from '@/lib/firebase';
import { useAuth } from '@/auth/AuthProvider';
import type { OffboardingStartInput, OffboardingTaskUpdate } from '@/types';

const startFn = httpsCallable(functions, 'startOffboarding');
const updateTaskFn = httpsCallable(functions, 'updateOffboardingTask');
const closeFn = httpsCallable(functions, 'closeOffboarding');

export interface OffboardingTask { key: string; label: string; done: boolean; }
export interface OffboardingRow {
  id: string; employeeId: string; departmentId: string; reason: string;
  lastDay: string; status: string; tasks: OffboardingTask[]; notes?: string;
}

/** Offboardings de l'organisation (RH/DRH/lecture) ou du département (manager). */
export function useOffboardings() {
  const { orgId, role, departmentId } = useAuth();
  const isStaff = ['super_admin', 'drh', 'rh', 'lecture'].includes(role ?? '');
  const isManager = role === 'manager';
  return useQuery<OffboardingRow[]>({
    queryKey: ['offboardings', orgId, role, departmentId],
    enabled: !!orgId && (isStaff || isManager),
    queryFn: async () => {
      const base = collection(db, 'offboardings');
      const q = isManager && !isStaff
        ? query(base, where('orgId', '==', orgId), where('departmentId', '==', departmentId), limit(200))
        : query(base, where('orgId', '==', orgId), limit(200));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<OffboardingRow, 'id'>) }));
    },
  });
}

export function useStartOffboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: OffboardingStartInput) => startFn(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['offboardings'] }),
  });
}
export function useUpdateOffboardingTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: OffboardingTaskUpdate) => updateTaskFn(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['offboardings'] }),
  });
}
export function useCloseOffboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => closeFn({ id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['offboardings'] }),
  });
}
