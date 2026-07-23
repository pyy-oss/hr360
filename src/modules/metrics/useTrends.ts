import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, callable } from '@/lib/firebase';
import { useAuth } from '@/auth/AuthProvider';

/**
 * Tendances RH : série d'instantanés quotidiens figés dans `metricSnapshots`.
 * Lecture réservée super_admin/DRH/RH/lecture/dirigeant (règles Firestore).
 * La capture du jour passe par la Cloud Function `captureMetricsSnapshot`
 * (réservée super_admin/DRH) — jamais d'écriture directe depuis le client.
 */

const READERS = ['super_admin', 'drh', 'rh', 'lecture', 'dirigeant'];

export interface MetricSnapshot {
  id: string;
  orgId: string;
  day: string;
  headcount: number;
  essai: number;
  confirme: number;
  sortant: number;
  openPositions: number;
  departuresInProgress: number;
  pendingLeave: number;
  activeCandidates: number;
}

const captureFn = callable<
  void,
  { ok: boolean; day: string; metrics: Record<string, number> }
>('captureMetricsSnapshot');

/** Historique des instantanés de l'organisation, du plus ancien au plus récent. */
export function useMetricSnapshots() {
  const { orgId, role } = useAuth();
  const canRead = READERS.includes(role ?? '');
  return useQuery<MetricSnapshot[]>({
    queryKey: ['metricSnapshots', orgId],
    enabled: !!orgId && canRead,
    queryFn: async () => {
      const snap = await getDocs(query(
        collection(db, 'metricSnapshots'),
        where('orgId', '==', orgId),
        orderBy('day', 'asc'),
        limit(60),
      ));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MetricSnapshot, 'id'>) }));
    },
  });
}

/** Fige l'instantané du jour (super_admin/DRH) puis rafraîchit l'historique. */
export function useCaptureSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await captureFn()).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['metricSnapshots'] }),
  });
}
