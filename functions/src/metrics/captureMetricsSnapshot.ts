import { onCall } from 'firebase-functions/v2/https';
import { db } from '../lib/admin';
import { assertRole } from '../lib/rbac';
import { writeAudit } from '../lib/audit';
import { FieldValue } from 'firebase-admin/firestore';
import { computeOrgMetrics } from './computeOrgMetrics';

/**
 * Fige un instantané daté des métriques RH de l'organisation (id = `${orgId}_${jour}`)
 * pour alimenter les tendances dans le temps. Réservé super_admin/DRH. Idempotent sur
 * la journée (ré-appeler écrase l'instantané du jour). Audit.
 */
export const captureMetricsSnapshot = onCall(async (req) => {
  const c = assertRole(req, ['super_admin', 'drh']);
  const day = new Date().toISOString().slice(0, 10);
  const metrics = await computeOrgMetrics(c.orgId);

  const id = `${c.orgId}_${day}`;
  await db.doc(`metricSnapshots/${id}`).set({
    orgId: c.orgId, day, ...metrics, capturedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  await writeAudit({
    actor: { uid: req.auth!.uid, claims: c },
    action: 'capture_metrics_snapshot', resource: 'metricSnapshots', resourceId: id,
    after: { day, headcount: metrics.headcount },
  });
  return { ok: true, day, metrics };
});
