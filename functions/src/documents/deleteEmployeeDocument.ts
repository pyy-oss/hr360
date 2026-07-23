import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { getStorage } from 'firebase-admin/storage';
import { db } from '../lib/admin';
import { assertRole, assertSameOrg } from '../lib/rbac';
import { writeAudit } from '../lib/audit';

const Schema = z.object({ id: z.string().min(1) });

/**
 * Supprime un document du coffre-fort (métadonnée + fichier Storage). Réservé RH/DRH,
 * dans l'organisation. Audit.
 */
export const deleteEmployeeDocument = onCall(async (req) => {
  const c = assertRole(req, ['super_admin', 'drh', 'rh']);
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', 'Requête invalide.');

  const ref = db.doc(`employeeDocuments/${p.data.id}`);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Document introuvable.');
  assertSameOrg(c, snap.get('orgId'));

  const storagePath = snap.get('storagePath') as string | undefined;
  if (storagePath) {
    await getStorage().bucket().file(storagePath).delete().catch(() => undefined);
  }
  await ref.delete();

  await writeAudit({
    actor: { uid: req.auth!.uid, claims: c },
    action: 'delete_document', resource: 'employeeDocuments', resourceId: p.data.id,
    before: { employeeId: snap.get('employeeId'), name: snap.get('name') },
  });
  return { ok: true };
});
