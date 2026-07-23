import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { callable, db } from '@/lib/firebase';
import { useAuth } from '@/auth/AuthProvider';
import type { KnowledgeDocInput } from '@/types';

const assistantFn = callable('aiAssistant');
const scoreFn = callable('scoreCandidate');
const generateFn = callable('generateContent');
const predictFn = callable('predictAttrition');
const askKnowledgeFn = callable('askKnowledge');
const upsertKnowledgeFn = callable('upsertKnowledgeDoc');
const analyzeSkillsFn = callable('analyzeSkills');

export interface ChatTurn { role: 'user' | 'assistant'; content: string; }

/** Assistant RH conversationnel (appel Claude côté serveur). */
export function useAssistant() {
  return useMutation({
    mutationFn: async (input: { message: string; history?: ChatTurn[] }) => {
      const res = await assistantFn(input);
      return res.data as { ok: boolean; text: string };
    },
  });
}

export interface ScoreAxis { axis: string; score: number; rationale: string; }
export interface ScoreResult { score: number; summary: string; axes: ScoreAxis[]; mustHaveGaps: string[]; }

/** Score d'adéquation candidat↔poste (aide à la décision). */
export function useScoreCandidate() {
  return useMutation({
    mutationFn: async (input: { candidateId: string; positionId: string }) => {
      const res = await scoreFn(input);
      return (res.data as { ok: boolean; result: ScoreResult }).result;
    },
  });
}

export type GenerationKind = 'offre' | 'fiche_poste' | 'compte_rendu' | 'reponse_candidat' | 'communication' | 'lettre_embauche';

/** Génération de contenu RH (Studio). */
export function useGenerateContent() {
  return useMutation({
    mutationFn: async (input: { kind: GenerationKind; positionId?: string; brief?: string; tone?: 'neutre' | 'chaleureux' | 'formel' }) => {
      const res = await generateFn(input);
      return (res.data as { ok: boolean; text: string }).text;
    },
  });
}

export interface PredictionResult {
  riskLevel: 'faible' | 'modere' | 'eleve';
  factors: { factor: string; note: string }[];
  actions: { action: string; note: string }[];
  caveat: string;
}
export interface PredictionAggregates {
  headcount: number; byStatus: Record<string, number>;
  departuresInProgress: number; pendingLeaveRequests: number; openPositions: number;
  engagement: { question: string; avg: number }[] | string; engagementResponses: number;
}

/** Analyse de rétention agrégée & anonyme (DRH). */
export function usePredictAttrition() {
  return useMutation({
    mutationFn: async () => {
      const res = await predictFn({});
      return res.data as { ok: boolean; result: PredictionResult; aggregates: PredictionAggregates };
    },
  });
}

export interface SkillsResult {
  summary: string;
  gaps: { skill: string; tension: 'forte' | 'moyenne' | 'couverte'; note: string }[];
  recommendations: { skill: string; approach: 'former' | 'recruter' | 'mixte'; note: string }[];
}
export interface SkillsAggregates {
  demandedSkills: Record<string, number>; openPositions: number;
  trainingNeeds: { skill: string; priority: string; department: string }[]; catalogCoverage: string[];
}

/** Analyse de l'écart de compétences (DRH/RH). */
export function useAnalyzeSkills() {
  return useMutation({
    mutationFn: async () => {
      const res = await analyzeSkillsFn({});
      return res.data as { ok: boolean; result: SkillsResult; aggregates: SkillsAggregates };
    },
  });
}

export interface KnowledgeAnswer {
  ok: boolean; text: string; citations: { title: string; quote: string }[]; docCount: number;
}
export interface KnowledgeDocRow { id: string; title: string; category: string; content: string; }

/** Base de connaissances RH — poser une question (RAG cité). */
export function useAskKnowledge() {
  return useMutation({
    mutationFn: async (question: string) => (await askKnowledgeFn({ question })).data as KnowledgeAnswer,
  });
}

/** Documents de la base de connaissances (lisibles par l'organisation). */
export function useKnowledgeDocs() {
  const { orgId } = useAuth();
  return useQuery<KnowledgeDocRow[]>({
    queryKey: ['knowledge', 'docs', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, 'knowledgeDocs'), where('orgId', '==', orgId), limit(100)));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<KnowledgeDocRow, 'id'>) }));
    },
  });
}

export function useUpsertKnowledgeDoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: KnowledgeDocInput) => upsertKnowledgeFn(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['knowledge'] }),
  });
}

export interface AiInvocationRow {
  id: string; feature: string; model: string; actorRole?: string;
  inputTokens?: number | null; outputTokens?: number | null;
  latencyMs?: number; ok: boolean;
}

/** Journal des appels IA (gouvernance — DRH/super_admin). */
export function useAiInvocations() {
  const { orgId, role } = useAuth();
  const canRead = ['super_admin', 'drh'].includes(role ?? '');
  return useQuery<AiInvocationRow[]>({
    queryKey: ['ai', 'invocations', orgId],
    enabled: !!orgId && canRead,
    queryFn: async () => {
      const snap = await getDocs(query(
        collection(db, 'aiInvocations'),
        where('orgId', '==', orgId), orderBy('at', 'desc'), limit(100),
      ));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AiInvocationRow, 'id'>) }));
    },
  });
}
