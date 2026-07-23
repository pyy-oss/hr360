import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../lib/admin';
import { assertRole, assertSameOrg } from '../lib/rbac';
import { writeAudit } from '../lib/audit';
import { FieldValue } from 'firebase-admin/firestore';

const Schema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(200),
  category: z.enum(['reglement', 'convention', 'procedure', 'note_rh', 'faq', 'autre']),
  content: z.string().min(1).max(20000),
});

/** Crée ou met à jour un document de la base de connaissances RH. Réservé RH/DRH. Audit. */
export const upsertKnowledgeDoc = onCall(async (req) => {
  const c = assertRole(req, ['super_admin', 'drh', 'rh']);
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', p.error.issues[0]?.message ?? 'Document invalide.');
  const { id, ...data } = p.data;

  const ref = id ? db.doc(`knowledgeDocs/${id}`) : db.collection('knowledgeDocs').doc();
  if (id) {
    const existing = await ref.get();
    if (!existing.exists) throw new HttpsError('not-found', 'Document introuvable.');
    assertSameOrg(c, existing.get('orgId'));
  }
  const payload: Record<string, unknown> = { orgId: c.orgId, ...data, updatedAt: FieldValue.serverTimestamp() };
  if (!id) payload.createdAt = FieldValue.serverTimestamp();
  await ref.set(payload, { merge: true });

  await writeAudit({
    actor: { uid: req.auth!.uid, claims: c },
    action: id ? 'update_knowledge_doc' : 'create_knowledge_doc',
    resource: 'knowledgeDocs', resourceId: ref.id, after: { title: data.title, category: data.category },
  });
  return { ok: true, id: ref.id };
});
