import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { functions, db } from '@/lib/firebase';
import { useAuth } from '@/auth/AuthProvider';
import type { LeaveRequestInput } from '@/types';

const submitFn = httpsCallable(functions, 'submitLeaveRequest');
const decideFn = httpsCallable(functions, 'decideLeaveRequest');

/** Mes demandes (paginées). Les règles Firestore limitent déjà à ce que je peux voir. */
export function useMyLeaveRequests() {
  const { employeeId } = useAuth();
  return useQuery({
    queryKey: ['leave', 'mine', employeeId],
    enabled: !!employeeId,
    queryFn: async () => {
      const q = query(
        collection(db, 'leaveRequests'),
        where('employeeId', '==', employeeId),
        orderBy('startDate', 'desc'),
        limit(25),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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
