import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../lib/admin';
import { assertRole, assertSameOrg } from '../lib/rbac';
import { writeAudit } from '../lib/audit';
import { FieldValue } from 'firebase-admin/firestore';

const Schema = z.object({
  employeeId: z.string().min(1),
  category: z.enum(['bulletin', 'attestation', 'contrat', 'autre']),
  name: z.string().min(1).max(200),
  storagePath: z.string().min(1).max(500),
});

/**
 * Enregistre la métadonnée d'un document RH déposé dans le coffre-fort d'un
 * collaborateur (le fichier lui-même est dans Storage, chemin
 * documents/{orgId}/{employeeId}/...). Réservé RH/DRH. Le chemin doit viser le bon
 * couple organisation/employé (anti-détournement). Audit.
 */
export const registerEmployeeDocument = onCall(async (req) => {
  const c = assertRole(req, ['super_admin', 'drh', 'rh']);
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', p.error.issues[0]?.message ?? 'Données invalides.');

  const emp = await db.doc(`employees/${p.data.employeeId}`).get();
  if (!emp.exists) throw new HttpsError('not-found', 'Collaborateur introuvable.');
  assertSameOrg(c, emp.get('orgId'));

  // Le chemin de stockage doit correspondre au couple org/employé (anti-usurpation).
  const expectedPrefix = `documents/${c.orgId}/${p.data.employeeId}/`;
  if (!p.data.storagePath.startsWith(expectedPrefix)) {
    throw new HttpsError('failed-precondition', 'Chemin de stockage invalide pour ce collaborateur.');
  }

  const ref = db.collection('employeeDocuments').doc();
  await ref.set({
    orgId: c.orgId, employeeId: p.data.employeeId, category: p.data.category,
    name: p.data.name, storagePath: p.data.storagePath, uploadedByUid: req.auth!.uid,
    createdAt: FieldValue.serverTimestamp(),
  });

  await writeAudit({
    actor: { uid: req.auth!.uid, claims: c },
    action: 'register_document', resource: 'employeeDocuments', resourceId: ref.id,
    after: { employeeId: p.data.employeeId, category: p.data.category, name: p.data.name },
  });
  return { ok: true, id: ref.id };
});
