import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { functions, db } from '@/lib/firebase';
import { useAuth } from '@/auth/AuthProvider';
import type { OnboardingStartInput, OnboardingTaskUpdate, ProbationDecisionInput } from '@/types';

const startFn = httpsCallable(functions, 'startOnboarding');
const updateTaskFn = httpsCallable(functions, 'updateOnboardingTask');
const closeFn = httpsCallable(functions, 'closeOnboarding');
const decideProbationFn = httpsCallable(functions, 'decideProbation');

export interface OnboardingTask { key: string; label: string; done: boolean; }
export interface OnboardingRow {
  id: string; employeeId: string; departmentId: string;
  startDate: string; status: string; tasks: OnboardingTask[]; notes?: string;
}

/** Intégrations de l'organisation (RH/DRH/lecture) ou du département (manager). */
export function useOnboardings() {
  const { orgId, role, departmentId } = useAuth();
  const isStaff = ['super_admin', 'drh', 'rh', 'lecture'].includes(role ?? '');
  const isManager = role === 'manager';
  return useQuery<OnboardingRow[]>({
    queryKey: ['onboardings', orgId, role, departmentId],
    enabled: !!orgId && (isStaff || isManager),
    queryFn: async () => {
      const base = collection(db, 'onboardings');
      const q = isManager && !isStaff
        ? query(base, where('orgId', '==', orgId), where('departmentId', '==', departmentId), limit(200))
        : query(base, where('orgId', '==', orgId), limit(200));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<OnboardingRow, 'id'>) }));
    },
  });
}

export function useStartOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: OnboardingStartInput) => startFn(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['onboardings'] }),
  });
}
export function useUpdateOnboardingTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: OnboardingTaskUpdate) => updateTaskFn(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['onboardings'] }),
  });
}
export function useCloseOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => closeFn({ id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['onboardings'] }),
  });
}

/** Décision de fin de période d'essai (confirme / non_confirme). Rafraîchit l'annuaire. */
export function useDecideProbation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProbationDecisionInput) => decideProbationFn(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['directory'] });
      qc.invalidateQueries({ queryKey: ['onboardings'] });
    },
  });
}
