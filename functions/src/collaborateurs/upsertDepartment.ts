import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../lib/admin';
import { assertRole, assertSameOrg } from '../lib/rbac';
import { writeAudit } from '../lib/audit';
import { FieldValue } from 'firebase-admin/firestore';

const Schema = z.object({
  id: z.string().optional(),        // fourni = mise à jour
  name: z.string().min(1),
  managerUid: z.string().optional(),
});

/** Crée ou met à jour un département. Réservé DRH/super_admin. Audit. */
export const upsertDepartment = onCall(async (req) => {
  const c = assertRole(req, ['super_admin', 'drh']);
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', 'Département invalide.');
  const { id, name, managerUid } = p.data;

  const ref = id ? db.doc(`departments/${id}`) : db.collection('departments').doc();
  if (id) {
    const existing = await ref.get();
    if (!existing.exists) throw new HttpsError('not-found', 'Département introuvable.');
    assertSameOrg(c, existing.get('orgId'));
  }
  const payload: Record<string, unknown> = {
    orgId: c.orgId, name, managerUid: managerUid ?? null, updatedAt: FieldValue.serverTimestamp(),
  };
  if (!id) payload.createdAt = FieldValue.serverTimestamp();
  await ref.set(payload, { merge: true });

  await writeAudit({
    actor: { uid: req.auth!.uid, claims: c },
    action: id ? 'update_department' : 'create_department',
    resource: 'departments', resourceId: ref.id, after: { name, managerUid },
  });
  return { ok: true, id: ref.id };
});
