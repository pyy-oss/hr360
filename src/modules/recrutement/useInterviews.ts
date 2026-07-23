import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { callable, db } from '@/lib/firebase';
import { useAuth } from '@/auth/AuthProvider';
import type { InterviewScheduleInput, InterviewUpdateInput } from '@/types';

const scheduleInterviewFn = callable('scheduleInterview');
const updateInterviewFn = callable('updateInterview');

export interface InterviewRow {
  id: string;
  candidateId: string;
  positionId?: string;
  departmentId?: string;
  scheduledAt: string;              // 'YYYY-MM-DDTHH:mm'
  mode: string;                     // 'visio' | 'present' | 'tel'
  interviewers?: string[];
  notes?: string;
  status: string;                   // 'planifie' | 'realise' | 'annule' | 'no_show'
  createdAt?: unknown;
  updatedAt?: unknown;
}

/** Entretiens de recrutement de l'organisation, triés par date. */
export function useInterviews() {
  const { orgId } = useAuth();
  return useQuery<InterviewRow[]>({
    queryKey: ['interviews', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const snap = await getDocs(query(
        collection(db, 'interviews'),
        where('orgId', '==', orgId),
        orderBy('scheduledAt', 'asc'),
        limit(200),
      ));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<InterviewRow, 'id'>) }));
    },
  });
}

export function useScheduleInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: InterviewScheduleInput) => scheduleInterviewFn(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['interviews'] }),
  });
}

export function useUpdateInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: InterviewUpdateInput) => updateInterviewFn(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['interviews'] }),
  });
}
