import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, limit, getDocs, getDoc, doc } from 'firebase/firestore';
import { functions, db } from '@/lib/firebase';
import { useAuth } from '@/auth/AuthProvider';
import type { SalaryBandInput, CompensationInput } from '@/types';

const upsertBandFn = httpsCallable(functions, 'upsertSalaryBand');
const setCompFn = httpsCallable(functions, 'setCompensation');

export interface SalaryBandRow {
  id: string; level: string; label: string;
  minAmount: number; midAmount: number; maxAmount: number; currency: string;
}
export interface CompensationRow {
  id: string; employeeId: string; departmentId: string; bandLevel: string;
  baseSalary: number; currency: string; effectiveDate: string;
}

/** Grille salariale (RH/DRH). */
export function useSalaryBands() {
  const { orgId, role } = useAuth();
  const canRead = ['super_admin', 'drh', 'rh'].includes(role ?? '');
  return useQuery<SalaryBandRow[]>({
    queryKey: ['remuneration', 'bands', orgId],
    enabled: !!orgId && canRead,
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, 'salaryBands'), where('orgId', '==', orgId), limit(20)));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SalaryBandRow, 'id'>) }));
    },
  });
}

/** Rémunérations individuelles de l'organisation (RH/DRH uniquement). */
export function useCompensations() {
  const { orgId, role } = useAuth();
  const canRead = ['super_admin', 'drh', 'rh'].includes(role ?? '');
  return useQuery<CompensationRow[]>({
    queryKey: ['remuneration', 'comp', orgId],
    enabled: !!orgId && canRead,
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, 'compensations'), where('orgId', '==', orgId), limit(500)));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CompensationRow, 'id'>) }));
    },
  });
}

/** Ma propre rémunération (collaborateur) — lecture ciblée par id. */
export function useMyCompensation() {
  const { employeeId } = useAuth();
  return useQuery<CompensationRow | null>({
    queryKey: ['remuneration', 'mine', employeeId],
    enabled: !!employeeId,
    queryFn: async () => {
      const snap = await getDoc(doc(db, 'compensations', employeeId!));
      return snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<CompensationRow, 'id'>) }) : null;
    },
  });
}

export function useUpsertSalaryBand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SalaryBandInput) => upsertBandFn(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['remuneration', 'bands'] }),
  });
}
export function useSetCompensation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CompensationInput) => setCompFn(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['remuneration'] }),
  });
}
