import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, limit, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/auth/AuthProvider';
import type { CandidateStage } from '@/types';
import { useDirectory, useDepartments } from '@/modules/collaborateurs/useCollaborateurs';
import { usePendingLeave } from '@/modules/absences/useLeave';
import { usePositions } from '@/modules/recrutement/useRecrutement';
import { useCampaigns } from '@/modules/objectifs/useObjectifs';
import { useOffboardings } from '@/modules/offboarding/useOffboarding';

/**
 * Couche d'agrégation partagée pour les écrans de pilotage (tableau de bord,
 * analytics, équité). Aucune donnée n'est inventée : tout est calculé à partir
 * des repositories typés existants ou de requêtes Firestore scopées par `orgId`.
 * Les lectures sensibles (auditLogs, aiInvocations) sont réservées super_admin/DRH
 * — sinon la requête est désactivée (`enabled: false`).
 */

export type EmployeeStatus = 'essai' | 'confirme' | 'sortant';

export interface DeptCount { id: string; name: string; count: number }

export interface OrgMetrics {
  headcount: number;
  byStatus: Record<EmployeeStatus, number>;
  byDepartment: DeptCount[];
  departments: number;
  pendingLeave: number;
  openPositions: number;
  activeCampaigns: number;
  departuresInProgress: number;
  /** Confirmés parmi l'effectif actif (essai + confirmé), en %. `null` si aucun actif. */
  confirmationRate: number | null;
}

/** Effectifs, congés en attente, postes ouverts, campagnes actives, départs en cours. */
export function useOrgMetrics() {
  const employees = useDirectory();
  const departments = useDepartments();
  const pendingLeave = usePendingLeave();
  const positions = usePositions();
  const campaigns = useCampaigns();
  const offboardings = useOffboardings();

  const metrics = useMemo<OrgMetrics>(() => {
    const emps = employees.data ?? [];
    const depts = departments.data ?? [];
    const byStatus: Record<EmployeeStatus, number> = { essai: 0, confirme: 0, sortant: 0 };
    const deptCounts = new Map<string, number>();
    for (const e of emps) {
      if (e.status === 'essai' || e.status === 'confirme' || e.status === 'sortant') byStatus[e.status] += 1;
      deptCounts.set(e.departmentId, (deptCounts.get(e.departmentId) ?? 0) + 1);
    }
    const nameOf = new Map(depts.map((d) => [d.id, d.name]));
    const byDepartment = [...deptCounts.entries()]
      .map(([id, count]) => ({ id, name: nameOf.get(id) ?? id, count }))
      .sort((a, b) => b.count - a.count);
    const active = byStatus.essai + byStatus.confirme;
    return {
      headcount: emps.length,
      byStatus,
      byDepartment,
      departments: depts.length,
      pendingLeave: (pendingLeave.data ?? []).length,
      openPositions: (positions.data ?? []).filter((p) => p.status === 'ouvert').length,
      activeCampaigns: (campaigns.data ?? []).filter((c) => c.phase !== 'cloturee').length,
      departuresInProgress: (offboardings.data ?? []).filter((o) => o.status === 'en_cours').length,
      confirmationRate: active > 0 ? Math.round((byStatus.confirme / active) * 100) : null,
    };
  }, [employees.data, departments.data, pendingLeave.data, positions.data, campaigns.data, offboardings.data]);

  return {
    metrics,
    isLoading: employees.isLoading || departments.isLoading,
    error: employees.error ?? departments.error ?? positions.error ?? campaigns.error ?? null,
  };
}

export interface FunnelStage { stage: CandidateStage; label: string; count: number }

const PIPELINE: { stage: CandidateStage; label: string }[] = [
  { stage: 'nouveau', label: 'Nouveaux' },
  { stage: 'preselection', label: 'Présélection' },
  { stage: 'entretien', label: 'Entretien' },
  { stage: 'offre', label: 'Offre' },
  { stage: 'embauche', label: 'Embauche' },
];

export interface RecruitmentFunnel {
  stages: FunnelStage[];
  total: number;
  vivier: number;
  rejete: number;
}

/**
 * Entonnoir de recrutement : comptage des candidats par étape du pipeline.
 * Donnée candidat sensible (ARTCI) → lecture réservée RH/DRH et manager du
 * département cible (la requête manager est scopée en conséquence).
 */
export function useRecruitmentFunnel() {
  const { orgId, role, departmentId } = useAuth();
  const isStaff = ['super_admin', 'drh', 'rh'].includes(role ?? '');
  const isManager = role === 'manager';
  const q = useQuery<Record<CandidateStage, number>>({
    queryKey: ['metrics', 'funnel', orgId, role, departmentId],
    enabled: !!orgId && (isStaff || (isManager && !!departmentId)),
    queryFn: async () => {
      const base = collection(db, 'candidates');
      const qq = isManager && !isStaff
        ? query(base, where('orgId', '==', orgId), where('departmentId', '==', departmentId), limit(300))
        : query(base, where('orgId', '==', orgId), limit(300));
      const snap = await getDocs(qq);
      const counts = {} as Record<CandidateStage, number>;
      snap.docs.forEach((d) => {
        const s = (d.data() as { stage: CandidateStage }).stage;
        counts[s] = (counts[s] ?? 0) + 1;
      });
      return counts;
    },
  });

  const funnel = useMemo<RecruitmentFunnel>(() => {
    const counts = q.data ?? ({} as Record<CandidateStage, number>);
    const stages = PIPELINE.map((p) => ({ ...p, count: counts[p.stage] ?? 0 }));
    return {
      stages,
      total: stages.reduce((s, x) => s + x.count, 0),
      vivier: counts.vivier ?? 0,
      rejete: counts.rejete ?? 0,
    };
  }, [q.data]);

  return {
    funnel,
    isLoading: q.isLoading,
    error: q.error,
    accessible: isStaff || (isManager && !!departmentId),
  };
}

export interface LeaveStatusCount { status: string; count: number }

const LEAVE_STATUS_LABEL: Record<string, string> = {
  soumis: 'Soumises', valide_manager: 'Validées manager', approuve: 'Approuvées',
  refuse: 'Refusées', annule: 'Annulées',
};
export const leaveStatusLabel = (s: string) => LEAVE_STATUS_LABEL[s] ?? s;

/** Répartition des demandes de congés par statut (org). Réservé RH/DRH/lecture. */
export function useLeaveByStatus() {
  const { orgId, role } = useAuth();
  const canRead = ['super_admin', 'drh', 'rh', 'lecture'].includes(role ?? '');
  return useQuery<LeaveStatusCount[]>({
    queryKey: ['metrics', 'leaveByStatus', orgId],
    enabled: !!orgId && canRead,
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, 'leaveRequests'), where('orgId', '==', orgId), limit(500)));
      const counts = new Map<string, number>();
      snap.docs.forEach((d) => {
        const s = (d.data() as { status: string }).status;
        counts.set(s, (counts.get(s) ?? 0) + 1);
      });
      return [...counts.entries()]
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count);
    },
  });
}

interface AuditDoc {
  action?: string; resource?: string; resourceId?: string;
  actorUid?: string; actorRole?: string; at?: Timestamp;
}

export interface AuditEntry {
  id: string; action: string; resource: string; resourceId: string;
  actorUid: string; actorRole?: string; at: Date | null;
}

const AUDIT_ACTION_LABEL: Record<string, string> = {
  create: 'Création', update: 'Modification', delete: 'Suppression',
  decide: 'Décision', close: 'Clôture', advance: 'Transition', publish: 'Publication',
};
/** Traduit un verbe d'action d'audit en libellé lisible (fallback : verbe brut). */
export function auditActionLabel(action: string): string {
  const key = Object.keys(AUDIT_ACTION_LABEL).find((k) => action.toLowerCase().includes(k));
  return key ? AUDIT_ACTION_LABEL[key] : action;
}

/**
 * Journal d'audit récent (append-only). Réservé super_admin/DRH.
 * Pas d'index composite (orgId + at) déclaré : on récupère un lot borné scopé
 * par `orgId` puis on trie par date côté client.
 */
export function useAuditFeed(max = 20) {
  const { orgId, role } = useAuth();
  const canRead = ['super_admin', 'drh'].includes(role ?? '');
  return useQuery<AuditEntry[]>({
    queryKey: ['metrics', 'audit', orgId, max],
    enabled: !!orgId && canRead,
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, 'auditLogs'), where('orgId', '==', orgId), limit(200)));
      const rows: AuditEntry[] = snap.docs.map((d) => {
        const x = d.data() as AuditDoc;
        return {
          id: d.id,
          action: x.action ?? 'action',
          resource: x.resource ?? '—',
          resourceId: x.resourceId ?? '',
          actorUid: x.actorUid ?? '—',
          actorRole: x.actorRole,
          at: x.at instanceof Timestamp ? x.at.toDate() : null,
        };
      });
      rows.sort((a, b) => (b.at?.getTime() ?? 0) - (a.at?.getTime() ?? 0));
      return rows.slice(0, max);
    },
  });
}

interface AiInvocationDoc { feature?: string; model?: string; ok?: boolean; actorRole?: string }

export interface AiUsage {
  total: number;
  okCount: number;
  failCount: number;
  successRate: number | null;
  byFeature: { feature: string; count: number }[];
  models: string[];
}

/** Agrégats d'usage de la couche IA (gouvernance). Réservé super_admin/DRH. */
export function useAiUsage() {
  const { orgId, role } = useAuth();
  const canRead = ['super_admin', 'drh'].includes(role ?? '');
  return useQuery<AiUsage>({
    queryKey: ['metrics', 'aiUsage', orgId],
    enabled: !!orgId && canRead,
    queryFn: async () => {
      const snap = await getDocs(query(
        collection(db, 'aiInvocations'),
        where('orgId', '==', orgId), orderBy('at', 'desc'), limit(200),
      ));
      const docs = snap.docs.map((d) => d.data() as AiInvocationDoc);
      const featCounts = new Map<string, number>();
      const models = new Set<string>();
      let okCount = 0;
      for (const d of docs) {
        featCounts.set(d.feature ?? 'autre', (featCounts.get(d.feature ?? 'autre') ?? 0) + 1);
        if (d.model) models.add(d.model);
        if (d.ok) okCount += 1;
      }
      const total = docs.length;
      return {
        total,
        okCount,
        failCount: total - okCount,
        successRate: total > 0 ? Math.round((okCount / total) * 100) : null,
        byFeature: [...featCounts.entries()].map(([feature, count]) => ({ feature, count })).sort((a, b) => b.count - a.count),
        models: [...models],
      };
    },
  });
}
