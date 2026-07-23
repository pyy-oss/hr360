import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/auth/AuthProvider';
import { usePositions } from '@/modules/recrutement/useRecrutement';
import { useTrainingCatalog } from '@/modules/formation/useFormation';

/** Besoin de formation au niveau organisation (lecture RH/DRH/lecture — cf. règles). */
export interface OrgTrainingNeed {
  id: string;
  skill: string;
  priority: 'basse' | 'moyenne' | 'haute';
  departmentId: string;
  status?: string;
}

/**
 * Besoins de formation de toute l'organisation. Réservé (côté règles Firestore) à
 * RH/DRH/lecture ; un rôle plus restreint recevra une erreur de permission — la vue
 * agrégée le gère en dégradant (les besoins ne pèsent alors pas dans la tension).
 */
export function useOrgTrainingNeeds(enabled = true) {
  const { orgId, role } = useAuth();
  const canRead = ['super_admin', 'drh', 'rh', 'lecture'].includes(role ?? '');
  return useQuery<OrgTrainingNeed[]>({
    queryKey: ['training', 'needs', 'org', orgId],
    enabled: !!orgId && canRead && enabled,
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, 'trainingNeeds'), where('orgId', '==', orgId), limit(200)));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<OrgTrainingNeed, 'id'>) }));
    },
  });
}

export type Tension = 'forte' | 'moyenne' | 'couverte';

export interface SkillAggregate {
  skill: string;
  /** Nombre de postes ouverts demandant la compétence (must ou nice). */
  demand: number;
  /** Nombre de postes l'exigeant comme incontournable (mustSkills). */
  mustDemand: number;
  /** Nombre de besoins de formation signalés sur cette compétence. */
  needCount: number;
  /** Priorité de formation la plus élevée signalée. */
  topPriority: 'basse' | 'moyenne' | 'haute' | null;
  /** Couverte par au moins un module du catalogue interne. */
  covered: boolean;
  tension: Tension;
}

export interface CompetencesMetrics {
  totalSkills: number;
  tensionCount: number;
  coveredCount: number;
  openPositions: number;
  needsCount: number;
}

const PRIORITY_RANK: Record<string, number> = { basse: 1, moyenne: 2, haute: 3 };
const norm = (s: string) => s.trim().toLowerCase();

/**
 * Vue agrégée des compétences de l'organisation : croise les compétences demandées
 * par les postes ouverts (usePositions), les besoins de formation (trainingNeeds) et
 * la couverture du catalogue interne (trainingCatalog). Purement dérivée des données
 * — aucune donnée nominative, aucune estimation inventée.
 */
export function useCompetences() {
  const positions = usePositions();
  const catalog = useTrainingCatalog();
  const needs = useOrgTrainingNeeds();

  const rows = useMemo<SkillAggregate[]>(() => {
    const posRows = (positions.data ?? []).filter((p) => p.status === 'ouvert');
    const catRows = catalog.data ?? [];
    const needRows = needs.data ?? [];

    const acc = new Map<string, { skill: string; demand: number; mustDemand: number; needCount: number; topPriority: SkillAggregate['topPriority'] }>();
    const bump = (raw: string, kind: 'must' | 'nice') => {
      const skill = raw.trim();
      if (!skill) return;
      const k = norm(skill);
      const cur = acc.get(k) ?? { skill, demand: 0, mustDemand: 0, needCount: 0, topPriority: null };
      cur.demand += 1;
      if (kind === 'must') cur.mustDemand += 1;
      acc.set(k, cur);
    };
    posRows.forEach((p) => {
      (p.mustSkills ?? []).forEach((s) => bump(s, 'must'));
      (p.niceSkills ?? []).forEach((s) => bump(s, 'nice'));
    });
    needRows.forEach((n) => {
      const skill = n.skill?.trim();
      if (!skill) return;
      const k = norm(skill);
      const cur = acc.get(k) ?? { skill, demand: 0, mustDemand: 0, needCount: 0, topPriority: null };
      cur.needCount += 1;
      if (!cur.topPriority || PRIORITY_RANK[n.priority] > PRIORITY_RANK[cur.topPriority]) cur.topPriority = n.priority;
      acc.set(k, cur);
    });

    const catalogText = catRows.map((c) => `${c.name ?? ''} ${c.tag ?? ''}`.toLowerCase());
    const isCovered = (skill: string) => {
      const k = norm(skill);
      return catalogText.some((t) => t.includes(k) || k.split(/[\s/&,]+/).some((tok) => tok.length > 3 && t.includes(tok)));
    };

    return Array.from(acc.values())
      .map((e) => {
        const covered = isCovered(e.skill);
        const priorityWeight = e.topPriority ? PRIORITY_RANK[e.topPriority] : 0;
        const score = e.mustDemand * 2 + (e.demand - e.mustDemand) + e.needCount * 2 + priorityWeight - (covered ? 2 : 0);
        const tension: Tension = score >= 4 ? 'forte' : score >= 2 ? 'moyenne' : 'couverte';
        return { ...e, covered, tension };
      })
      .sort((a, b) => {
        const rank = { forte: 0, moyenne: 1, couverte: 2 } as const;
        if (rank[a.tension] !== rank[b.tension]) return rank[a.tension] - rank[b.tension];
        return b.demand - a.demand;
      });
  }, [positions.data, catalog.data, needs.data]);

  const metrics = useMemo<CompetencesMetrics>(() => ({
    totalSkills: rows.length,
    tensionCount: rows.filter((r) => r.tension === 'forte').length,
    coveredCount: rows.filter((r) => r.covered).length,
    openPositions: (positions.data ?? []).filter((p) => p.status === 'ouvert').length,
    needsCount: (needs.data ?? []).length,
  }), [rows, positions.data, needs.data]);

  return {
    rows,
    metrics,
    isLoading: positions.isLoading || catalog.isLoading || needs.isLoading,
    error: positions.error ?? catalog.error ?? null,
  };
}
