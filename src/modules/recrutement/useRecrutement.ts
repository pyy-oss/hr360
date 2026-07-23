import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { callable, db } from '@/lib/firebase';
import { useAuth } from '@/auth/AuthProvider';
import type { PositionInput, CandidateInput, CandidateStageUpdate, CandidateStage } from '@/types';

const upsertPositionFn = callable('upsertPosition');
const upsertCandidateFn = callable('upsertCandidate');
const advanceStageFn = callable('advanceCandidateStage');

export interface PositionRow {
  id: string; title: string; departmentId: string; level: string;
  contractType: string; openings: number; status: string;
  mustSkills?: string[]; niceSkills?: string[]; excludedCriteria?: string[];
  weights?: { technique: number; experience: number; soft: number; formation: number };
}
export interface CandidateRow {
  id: string; firstName: string; lastName: string; email: string; phone?: string;
  source: string; positionId?: string; departmentId?: string;
  yearsExperience: number; stage: CandidateStage; matchScore?: number; tags?: string[];
}

/** Ouvertures de poste de l'organisation. */
export function usePositions() {
  const { orgId } = useAuth();
  return useQuery<PositionRow[]>({
    queryKey: ['positions', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, 'positions'), where('orgId', '==', orgId), limit(100)));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PositionRow, 'id'>) }));
    },
  });
}

/** Vivier / candidats de l'organisation. Le filtrage par étape se fait côté client. */
export function useCandidates(stage?: CandidateStage) {
  const { orgId } = useAuth();
  return useQuery<CandidateRow[]>({
    queryKey: ['candidates', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, 'candidates'), where('orgId', '==', orgId), limit(200)));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CandidateRow, 'id'>) }));
    },
    select: stage ? (rows) => rows.filter((r) => r.stage === stage) : undefined,
  });
}

export function useUpsertPosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PositionInput) => upsertPositionFn(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['positions'] }),
  });
}

export function useUpsertCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CandidateInput) => upsertCandidateFn(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['candidates'] }),
  });
}

export function useAdvanceCandidateStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CandidateStageUpdate) => advanceStageFn(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['candidates'] }),
  });
}
