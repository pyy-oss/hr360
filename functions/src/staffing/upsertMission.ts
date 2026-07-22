import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../lib/admin';
import { assertDeptManagerOrHR, assertSameOrg, getClaims } from '../lib/rbac';
import { writeAudit } from '../lib/audit';
import { FieldValue } from 'firebase-admin/firestore';

const Schema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  client: z.string().min(1),
  departmentId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  status: z.enum(['prospect', 'active', 'terminee', 'suspendue']).default('prospect'),
});

/** Crée ou met à jour une mission (manager du département ou RH/DRH). Audit. */
export const upsertMission = onCall(async (req) => {
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', 'Mission invalide.');
  const { id, ...data } = p.data;

  const c = getClaims(req);
  const ref = id ? db.doc(`missions/${id}`) : db.collection('missions').doc();
  if (id) {
    const existing = await ref.get();
    if (!existing.exists) throw new HttpsError('not-found', 'Mission introuvable.');
    assertSameOrg(c, existing.get('orgId'));
    // Droit basé sur le département EXISTANT (pas celui soumis) : empêche de
    // détourner la mission d'un autre département vers le sien.
    assertDeptManagerOrHR(req, existing.get('departmentId'));
  }
  // Droit sur le département cible (création, ou déplacement autorisé).
  assertDeptManagerOrHR(req, data.departmentId);
  const payload: Record<string, unknown> = { orgId: c.orgId, ...data, updatedAt: FieldValue.serverTimestamp() };
  if (!id) payload.createdAt = FieldValue.serverTimestamp();
  await ref.set(payload, { merge: true });

  await writeAudit({
    actor: { uid: req.auth!.uid, claims: c },
    action: id ? 'update_mission' : 'create_mission', resource: 'missions', resourceId: ref.id,
    after: { name: data.name, status: data.status },
  });
  return { ok: true, id: ref.id };
});
