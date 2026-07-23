import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { functions, db } from '@/lib/firebase';
import { useAuth } from '@/auth/AuthProvider';
import type { CreateSurveyInput, SubmitResponseInput, EngagementQuestion } from '@/types';

const createFn = httpsCallable(functions, 'createEngagementSurvey');
const closeFn = httpsCallable(functions, 'closeEngagementSurvey');
const submitFn = httpsCallable(functions, 'submitEngagementResponse');
const resultsFn = httpsCallable(functions, 'getEngagementResults');

export interface SurveyRow {
  id: string; title: string; status: string; questions: EngagementQuestion[];
}
export interface SurveyResults {
  ok: boolean; responseCount: number; minResponses: number; belowThreshold: boolean;
  status: string; title: string;
  perQuestion: { key: string; label: string; avg: number | null; count: number }[];
}

/** Enquêtes de l'organisation (lisibles par tous, pour répondre). */
export function useSurveys() {
  const { orgId } = useAuth();
  return useQuery<SurveyRow[]>({
    queryKey: ['engagement', 'surveys', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const snap = await getDocs(query(
        collection(db, 'engagementSurveys'),
        where('orgId', '==', orgId), orderBy('createdAt', 'desc'), limit(20),
      ));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SurveyRow, 'id'>) }));
    },
  });
}

/** Résultats agrégés (RH/DRH) — via Cloud Function, jamais de réponse individuelle. */
export function useSurveyResults(surveyId?: string, enabled = true) {
  const { role } = useAuth();
  const canRead = ['super_admin', 'drh', 'rh'].includes(role ?? '');
  return useQuery<SurveyResults>({
    queryKey: ['engagement', 'results', surveyId],
    enabled: !!surveyId && canRead && enabled,
    queryFn: async () => (await resultsFn({ surveyId })).data as SurveyResults,
  });
}

export function useCreateSurvey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSurveyInput) => createFn(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['engagement', 'surveys'] }),
  });
}
export function useCloseSurvey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (surveyId: string) => closeFn({ surveyId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['engagement'] }),
  });
}
export function useSubmitResponse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitResponseInput) => submitFn(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['engagement'] }),
  });
}
