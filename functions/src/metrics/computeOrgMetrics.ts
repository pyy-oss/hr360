import { db } from '../lib/admin';

export interface OrgMetrics {
  headcount: number;
  essai: number;
  confirme: number;
  sortant: number;
  openPositions: number;
  departuresInProgress: number;
  pendingLeave: number;
  activeCandidates: number;
}

/**
 * Calcule les métriques RH agrégées d'une organisation à l'instant t (aucune donnée
 * nominative). Partagé entre la capture manuelle et une éventuelle capture planifiée.
 */
export async function computeOrgMetrics(orgId: string): Promise<OrgMetrics> {
  const [emps, positions, offb, leave, candidates] = await Promise.all([
    db.collection('employees').where('orgId', '==', orgId).limit(5000).get(),
    db.collection('positions').where('orgId', '==', orgId).where('status', '==', 'ouvert').limit(500).get(),
    db.collection('offboardings').where('orgId', '==', orgId).where('status', '==', 'en_cours').limit(500).get(),
    db.collection('leaveRequests').where('orgId', '==', orgId).where('status', 'in', ['soumis', 'valide_manager']).limit(1000).get(),
    db.collection('candidates').where('orgId', '==', orgId).limit(2000).get(),
  ]);

  const byStatus = { essai: 0, confirme: 0, sortant: 0 };
  emps.forEach((d) => { const s = d.get('status') as string; if (s in byStatus) (byStatus as Record<string, number>)[s] += 1; });

  const closedStages = ['embauche', 'rejete', 'retire'];
  let activeCandidates = 0;
  candidates.forEach((d) => { if (!closedStages.includes(d.get('stage') as string)) activeCandidates += 1; });

  return {
    headcount: emps.size,
    essai: byStatus.essai, confirme: byStatus.confirme, sortant: byStatus.sortant,
    openPositions: positions.size,
    departuresInProgress: offb.size,
    pendingLeave: leave.size,
    activeCandidates,
  };
}
