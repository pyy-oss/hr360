import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, orderBy, limit, getDocs, QueryConstraint } from 'firebase/firestore';
import { functions, db } from '@/lib/firebase';
import { useAuth } from '@/auth/AuthProvider';
import type {
  AdvancePhaseInput, PublishEvaluationInput, ValidateObjectiveInput, ObjectiveInput,
} from '@/types';

const advancePhaseFn = httpsCallable(functions, 'advanceCampaignPhase');
const publishEvalFn = httpsCallable(functions, 'publishEvaluation');
const validateObjFn = httpsCallable(functions, 'validateObjective');
const createCampaignFn = httpsCallable(functions, 'createObjectiveCampaign');
const upsertObjectiveFn = httpsCallable(functions, 'upsertObjective');

export interface CampaignRow { id: string; name: string; year: number; phase: string; }
export interface ObjectiveRow {
  id: string; campaignId: string; employeeId: string; departmentId: string;
  title: string; measure?: string; weight: number; status: string;
}

/** Campagnes de l'organisation. */
export function useCampaigns() {
  return useQuery<CampaignRow[]>({
    queryKey: ['objectifs', 'campaigns'],
    queryFn: async () => {
      const q = query(
        collection(db, 'objectiveCampaigns'),
        orderBy('year', 'desc'), limit(10),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CampaignRow, 'id'>) }));
    },
  });
}

/**
 * Objectifs d'une campagne, portée alignée sur les règles Firestore :
 * - RH/DRH/lecture : toute l'organisation ;
 * - manager : uniquement son département ;
 * - autre : uniquement ses propres objectifs.
 * (Une requête plus large serait rejetée en bloc par les règles.)
 */
export function useCampaignObjectives(campaignId?: string) {
  const { role, departmentId, employeeId } = useAuth();
  return useQuery<ObjectiveRow[]>({
    queryKey: ['objectifs', 'campaign-obj', campaignId, role, departmentId, employeeId],
    enabled: !!campaignId,
    queryFn: async () => {
      const cons: QueryConstraint[] = [where('campaignId', '==', campaignId)];
      if (['super_admin', 'drh', 'rh', 'lecture'].includes(role ?? '')) {
        // portée organisation
      } else if (role === 'manager' && departmentId) {
        cons.push(where('departmentId', '==', departmentId));
      } else {
        cons.push(where('employeeId', '==', employeeId ?? '__none__'));
      }
      cons.push(limit(200));
      const snap = await getDocs(query(collection(db, 'objectives'), ...cons));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ObjectiveRow, 'id'>) }));
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
export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; year: number }) => createCampaignFn(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['objectifs', 'campaigns'] }),
  });
}
export function useUpsertObjective() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ObjectiveInput & { id?: string }) => upsertObjectiveFn(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['objectifs'] }),
  });
}
