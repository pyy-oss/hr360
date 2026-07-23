import { useMemo } from 'react';
import type { CandidateStage } from '@/types';
import { usePositions, useCandidates, type CandidateRow, type PositionRow } from './useRecrutement';
import type { EmployeeRow } from '@/modules/collaborateurs/useCollaborateurs';

// ---------------------------------------------------------------------------
// Constantes de pipeline — dérivées des CandidateStage RÉELS (src/types).
// Aucune étape inventée : on réutilise l'enum du référentiel.
// ---------------------------------------------------------------------------
export const STAGE_LABEL: Record<CandidateStage, string> = {
  nouveau: 'Nouveau', preselection: 'Présélection', entretien: 'Entretien',
  offre: 'Offre', embauche: 'Embauché', rejete: 'Écarté', vivier: 'Vivier',
};

// Entonnoir de sélection (dans l'ordre). Exclut « vivier » (hors flux actif)
// et « rejete » (sortie). Sert au comptage et aux taux de conversion.
export const FUNNEL_ORDER: CandidateStage[] = ['nouveau', 'preselection', 'entretien', 'offre', 'embauche'];

// Étapes de fin de pipeline traitées par l'écran Décision & jury.
export const DECISION_STAGES: CandidateStage[] = ['entretien', 'offre'];

// Étape suivante « naturelle » (le recruteur reste maître de la décision).
export const NEXT_STAGE: Partial<Record<CandidateStage, CandidateStage>> = {
  nouveau: 'preselection', preselection: 'entretien', entretien: 'offre',
  offre: 'embauche', vivier: 'preselection', rejete: 'vivier',
};

export const initials = (first?: string, last?: string): string =>
  ((first?.[0] ?? '') + (last?.[0] ?? '')).toUpperCase() || '—';

export const scoreClass = (s?: number): string =>
  s == null ? '' : s >= 80 ? 'sb-high' : s >= 60 ? 'sb-mid' : 'sb-low';

// ---------------------------------------------------------------------------
// Métriques de pipeline — 100 % dérivées de useCandidates / usePositions.
// ---------------------------------------------------------------------------
export interface StageCount { stage: CandidateStage; label: string; count: number; }
export interface ConversionStep { from: CandidateStage; to: CandidateStage; label: string; rate: number | null; }
export interface PositionPressure {
  position: PositionRow; openings: number; candidates: number; ratio: number; tension: boolean;
}
export interface PipelineMetrics {
  total: number;
  received: number;        // candidatures actives (hors écartées)
  toAttach: number;        // sans positionId (spontanées / à rattacher)
  scored: number;          // avec un score renseigné
  hired: number;
  rejected: number;
  byStage: StageCount[];
  funnel: StageCount[];
  conversions: ConversionStep[];
  pressure: PositionPressure[];
}

/** Agrège le vivier réel en indicateurs de pilotage. */
export function computePipelineMetrics(candidates: CandidateRow[], positions: PositionRow[]): PipelineMetrics {
  const byStageMap = new Map<CandidateStage, number>();
  for (const c of candidates) byStageMap.set(c.stage, (byStageMap.get(c.stage) ?? 0) + 1);

  const byStage: StageCount[] = (Object.keys(STAGE_LABEL) as CandidateStage[])
    .map((stage) => ({ stage, label: STAGE_LABEL[stage], count: byStageMap.get(stage) ?? 0 }));

  const funnel: StageCount[] = FUNNEL_ORDER.map((stage) => ({
    stage, label: STAGE_LABEL[stage], count: byStageMap.get(stage) ?? 0,
  }));

  // Taux de conversion approximatif : part des candidats ayant atteint l'étape
  // suivante ou au-delà, rapportée à l'étape courante (sans historique serveur).
  const atOrBeyond = (idx: number): number =>
    candidates.filter((c) => {
      const i = FUNNEL_ORDER.indexOf(c.stage);
      return i >= idx;
    }).length;
  const conversions: ConversionStep[] = FUNNEL_ORDER.slice(0, -1).map((from, i) => {
    const base = atOrBeyond(i);
    const next = atOrBeyond(i + 1);
    return {
      from, to: FUNNEL_ORDER[i + 1],
      label: `${STAGE_LABEL[from]} → ${STAGE_LABEL[FUNNEL_ORDER[i + 1]]}`,
      rate: base > 0 ? Math.round((next / base) * 100) : null,
    };
  });

  const openStatuses = ['ouvert', 'en_cours'];
  const pressure: PositionPressure[] = positions
    .filter((p) => openStatuses.includes(p.status))
    .map((p) => {
      const count = candidates.filter((c) => c.positionId === p.id && c.stage !== 'rejete').length;
      const openings = p.openings || 1;
      const ratio = count / openings;
      return { position: p, openings, candidates: count, ratio, tension: ratio < 2 };
    })
    .sort((a, b) => a.ratio - b.ratio);

  const rejected = byStageMap.get('rejete') ?? 0;
  const hired = byStageMap.get('embauche') ?? 0;

  return {
    total: candidates.length,
    received: candidates.filter((c) => c.stage !== 'rejete').length,
    toAttach: candidates.filter((c) => !c.positionId && c.stage !== 'rejete' && c.stage !== 'embauche').length,
    scored: candidates.filter((c) => c.matchScore != null).length,
    hired, rejected, byStage, funnel, conversions, pressure,
  };
}

/** Hook prêt à l'emploi pour l'écran de pilotage. */
export function usePipelineMetrics() {
  const candidates = useCandidates();
  const positions = usePositions();
  const metrics = useMemo(
    () => computePipelineMetrics(candidates.data ?? [], positions.data ?? []),
    [candidates.data, positions.data],
  );
  return {
    metrics,
    isLoading: candidates.isLoading || positions.isLoading,
    error: candidates.error ?? positions.error,
    isEmpty: !candidates.isLoading && (candidates.data?.length ?? 0) === 0,
  };
}

// ---------------------------------------------------------------------------
// Mobilité interne — rapprochement HEURISTIQUE (aide à la décision, jamais
// automatique). Croise l'annuaire réel avec les compétences attendues du poste.
// ---------------------------------------------------------------------------
export interface MobilityMatch {
  employee: EmployeeRow;
  score: number;          // indice de rapprochement 0–100
  sameDept: boolean;
  skillHits: string[];    // compétences attendues repérées dans l'intitulé
  gaps: string[];         // must-have non repérés → axes de montée en compétences
}

const norm = (s: string): string => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function skillMatches(text: string, skill: string): boolean {
  const t = norm(text);
  return norm(skill).split(/[\s/]+/).filter((w) => w.length >= 3).some((w) => t.includes(w));
}

/** Rapproche les collaborateurs (hors sortants) d'un poste ouvert. */
export function matchEmployeesToPosition(position: PositionRow, employees: EmployeeRow[]): MobilityMatch[] {
  const must = position.mustSkills ?? [];
  const nice = position.niceSkills ?? [];
  return employees
    .filter((e) => e.status !== 'sortant')
    .map((e) => {
      const sameDept = e.departmentId === position.departmentId;
      const hitMust = must.filter((s) => skillMatches(e.jobTitle, s));
      const hitNice = nice.filter((s) => skillMatches(e.jobTitle, s));
      const skillHits = [...hitMust, ...hitNice];
      const gaps = must.filter((s) => !hitMust.includes(s));

      let score = sameDept ? 45 : 15;
      if (must.length > 0) score += Math.round((hitMust.length / must.length) * 45);
      else score += sameDept ? 25 : 10;
      score += Math.min(hitNice.length * 5, 10);
      return { employee: e, score: Math.min(score, 100), sameDept, skillHits, gaps };
    })
    .filter((m) => m.sameDept || m.skillHits.length > 0)
    .sort((a, b) => b.score - a.score);
}
