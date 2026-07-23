import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../lib/admin';
import { assertRole } from '../lib/rbac';
import { writeAudit } from '../lib/audit';
import { FieldValue } from 'firebase-admin/firestore';

const Schema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  year: z.number().int().min(2020).max(2100),
});

/** Crée une campagne annuelle d'objectifs (phase initiale « preparation »). Réservé DRH. Audit. */
export const createObjectiveCampaign = onCall(async (req) => {
  const c = assertRole(req, ['super_admin', 'drh']);
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', p.error.issues[0]?.message ?? 'Campagne invalide.');
  const { id, name, year } = p.data;

  const ref = id ? db.doc(`objectiveCampaigns/${id}`) : db.collection('objectiveCampaigns').doc();
  const existing = await ref.get();
  const payload: Record<string, unknown> = { orgId: c.orgId, name, year, updatedAt: FieldValue.serverTimestamp() };
  // La phase n'est jamais rétrogradée ici : création uniquement, transitions via advanceCampaignPhase.
  if (!existing.exists) { payload.phase = 'preparation'; payload.createdAt = FieldValue.serverTimestamp(); }
  await ref.set(payload, { merge: true });

  await writeAudit({
    actor: { uid: req.auth!.uid, claims: c },
    action: existing.exists ? 'update_campaign' : 'create_campaign',
    resource: 'objectiveCampaigns', resourceId: ref.id,
    after: { name, year },
  });
  return { ok: true, id: ref.id };
});
