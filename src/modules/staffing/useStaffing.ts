import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { functions, db } from '@/lib/firebase';
import { useAuth } from '@/auth/AuthProvider';
import type { MissionInput, AssignmentInput } from '@/types';

const upsertMissionFn = httpsCallable(functions, 'upsertMission');
const upsertAssignmentFn = httpsCallable(functions, 'upsertAssignment');

export interface MissionRow {
  id: string; name: string; client: string; departmentId: string; status: string;
  startDate: string; endDate?: string;
}
export interface AssignmentRow {
  id: string; missionId: string; employeeId: string; departmentId: string;
  allocationPct: number; startDate: string; endDate: string; status: string;
}

/** Missions du département (manager) ou de toute l'organisation (RH/DRH). */
export function useMissions() {
  const { role, departmentId } = useAuth();
  const scoped = role === 'manager' ? departmentId : undefined;
  return useQuery<MissionRow[]>({
    queryKey: ['staffing', 'missions', scoped ?? 'all'],
    queryFn: async () => {
      const base = collection(db, 'missions');
      const q = scoped
        ? query(base, where('departmentId', '==', scoped), orderBy('startDate', 'desc'), limit(100))
        : query(base, orderBy('startDate', 'desc'), limit(100));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MissionRow, 'id'>) }));
    },
  });
}

/** Affectations d'un collaborateur (plan de charge individuel). */
export function useEmployeeAssignments(employeeId?: string) {
  return useQuery<AssignmentRow[]>({
    queryKey: ['staffing', 'assignments', employeeId],
    enabled: !!employeeId,
    queryFn: async () => {
      const q = query(
        collection(db, 'assignments'),
        where('employeeId', '==', employeeId),
        where('status', 'in', ['prevue', 'active']),
        limit(100),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AssignmentRow, 'id'>) }));
    },
  });
}

export function useUpsertMission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MissionInput) => upsertMissionFn(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staffing', 'missions'] }),
  });
}
export function useUpsertAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AssignmentInput) => upsertAssignmentFn(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staffing', 'assignments'] }),
  });
}
