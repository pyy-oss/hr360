import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { functions, db } from '@/lib/firebase';
import { useAuth } from '@/auth/AuthProvider';
import type { AdvancePhaseInput, PublishEvaluationInput, ValidateObjectiveInput } from '@/types';

const advancePhaseFn = httpsCallable(functions, 'advanceCampaignPhase');
const publishEvalFn = httpsCallable(functions, 'publishEvaluation');
const validateObjFn = httpsCallable(functions, 'validateObjective');

/** Campagnes de l'organisation. */
export function useCampaigns() {
  return useQuery({
    queryKey: ['objectifs', 'campaigns'],
    queryFn: async () => {
      const q = query(
        collection(db, 'objectiveCampaigns'),
        orderBy('year', 'desc'), limit(10),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    },
  });
}

/** Mes objectifs pour une campagne donnée. */
export function useMyObjectives(campaignId?: string) {
  const { employeeId } = useAuth();
  return useQuery({
    queryKey: ['objectifs', 'mine', campaignId, employeeId],
    enabled: !!campaignId && !!employeeId,
    queryFn: async () => {
      const q = query(
        collection(db, 'objectives'),
        where('campaignId', '==', campaignId),
        where('employeeId', '==', employeeId),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    },
  });
}

export function useAdvancePhase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AdvancePhaseInput) => advancePhaseFn(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['objectifs', 'campaigns'] }),
  });
}
export function usePublishEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PublishEvaluationInput) => publishEvalFn(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['objectifs'] }),
  });
}
export function useValidateObjective() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ValidateObjectiveInput) => validateObjFn(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['objectifs'] }),
  });
}
