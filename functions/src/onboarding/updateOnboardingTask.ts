import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../lib/admin';
import { assertDeptManagerOrHR, assertSameOrg } from '../lib/rbac';
import { writeAudit } from '../lib/audit';
import { FieldValue } from 'firebase-admin/firestore';

const Schema = z.object({
  id: z.string().min(1),
  taskKey: z.string().min(1),
  done: z.boolean(),
});

/**
 * Coche/décoche une tâche de la checklist d'intégration. RH/DRH ou manager du
 * département. Transactionnel (lecture-modification du tableau). Audit.
 */
export const updateOnboardingTask = onCall(async (req) => {
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', 'Requête invalide.');
  const { id, taskKey, done } = p.data;

  const ref = db.doc(`onboardings/${id}`);
  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpsError('not-found', 'Intégration introuvable.');
    const claims = assertDeptManagerOrHR(req, snap.get('departmentId'));
    assertSameOrg(claims, snap.get('orgId'));
    if (snap.get('status') !== 'en_cours') {
      throw new HttpsError('failed-precondition', 'Intégration clôturée — non modifiable.');
    }
    const tasks = (snap.get('tasks') as { key: string; label: string; done: boolean }[]) ?? [];
    const idx = tasks.findIndex((t) => t.key === taskKey);
    if (idx < 0) throw new HttpsError('invalid-argument', 'Tâche inconnue.');
    tasks[idx] = { ...tasks[idx], done };
    tx.update(ref, { tasks, updatedAt: FieldValue.serverTimestamp() });
    return claims;
  });

  await writeAudit({
    actor: { uid: req.auth!.uid, claims: result },
    action: 'update_onboarding_task', resource: 'onboardings', resourceId: id,
    after: { taskKey, done },
  });
  return { ok: true };
});
