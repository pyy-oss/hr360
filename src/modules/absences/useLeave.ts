import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { callable, db } from '@/lib/firebase';
import { useAuth } from '@/auth/AuthProvider';
import type { LeaveRequestInput } from '@/types';

const submitFn = callable('submitLeaveRequest');
const decideFn = callable('decideLeaveRequest');
const seedFn = callable('seedDemoData');

export interface LeaveRequestDoc {
  id: string; employeeId: string; employeeName?: string; departmentId?: string;
  type: string; days: number; startDate: string; endDate: string; status: string;
}
export interface LeaveBalanceDoc {
  id: string; employeeId: string;
  entitlements?: Record<string, number>; taken?: Record<string, number>; pending?: Record<string, number>;
}

/** File des demandes à valider (org) — lisible par RH/DRH/manager (règles serveur). */
export function usePendingLeave() {
  const { orgId, role } = useAuth();
  const canValidate = role === 'super_admin' || role === 'drh' || role === 'rh' || role === 'manager';
  return useQuery({
    queryKey: ['leave', 'pending', orgId],
    enabled: !!orgId && canValidate,
    queryFn: async () => {
      const q = query(
        collection(db, 'leaveRequests'),
        where('orgId', '==', orgId),
        where('status', 'in', ['soumis', 'valide_manager']),
        limit(50),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as LeaveRequestDoc[];
    },
  });
}

/** Soldes de congés de l'organisation. */
export function useLeaveBalances() {
  const { orgId } = useAuth();
  return useQuery({
    queryKey: ['leaveBalances', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const q = query(collection(db, 'leaveBalances'), where('orgId', '==', orgId), limit(100));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as LeaveBalanceDoc[];
    },
  });
}

/** Annuaire (org) — pour résoudre id → nom. */
export function useEmployeesMap() {
  const { orgId } = useAuth();
  return useQuery({
    queryKey: ['employees', 'map', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const q = query(collection(db, 'employees'), where('orgId', '==', orgId), limit(200));
      const snap = await getDocs(q);
      const map: Record<string, string> = {};
      snap.docs.forEach((d) => {
        const e = d.data() as { firstName?: string; lastName?: string };
        map[d.id] = [e.firstName, e.lastName].filter(Boolean).join(' ') || d.id;
      });
      return map;
    },
  });
}

/** Amorçage des données de démo (super_admin). */
export function useSeedDemo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => seedFn({}),
    onSuccess: () => qc.invalidateQueries(),
  });
}

/** Mes demandes (paginées). Les règles Firestore limitent déjà à ce que je peux voir. */
export function useMyLeaveRequests() {
  const { orgId, employeeId } = useAuth();
  return useQuery({
    queryKey: ['leave', 'mine', orgId, employeeId],
    enabled: !!employeeId && !!orgId,
    queryFn: async () => {
      const q = query(
        collection(db, 'leaveRequests'),
        where('orgId', '==', orgId),
        where('employeeId', '==', employeeId),
        limit(25),
      );
      const snap = await getDocs(q);
      return snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }))
        .sort((a, b) => String((b as { startDate?: string }).startDate ?? '').localeCompare(String((a as { startDate?: string }).startDate ?? '')));
    },
  });
}

export function useSubmitLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LeaveRequestInput) => submitFn(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leave', 'mine'] }),
  });
}

export function useDecideLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { id: string; decision: 'approuve' | 'refuse'; comment?: string }) => decideFn(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leave'] }),
  });
}
