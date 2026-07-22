import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../lib/admin';
import { assertRole, assertSameOrg } from '../lib/rbac';
import { writeAudit } from '../lib/audit';
import { FieldValue } from 'firebase-admin/firestore';

const Schema = z.object({
  campaignId: z.string().min(1),
  toPhase: z.enum(['preparation', 'fixation', 'suivi', 'evaluation', 'cloturee']),
});

// Transitions autorisées (linéaires, sans saut arrière).
const ORDER = ['preparation', 'fixation', 'suivi', 'evaluation', 'cloturee'];

/** Fait avancer une campagne de phase. Réservé DRH. Verrou métier + audit. */
export const advanceCampaignPhase = onCall(async (req) => {
  const c = assertRole(req, ['super_admin', 'drh']);
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', 'Requête invalide.');
  const { campaignId, toPhase } = p.data;

  const ref = db.doc(`objectiveCampaigns/${campaignId}`);
  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpsError('not-found', 'Campagne introuvable.');
    assertSameOrg(c, snap.get('orgId'));
    const from = snap.get('phase') as string;
    if (ORDER.indexOf(toPhase) !== ORDER.indexOf(from) + 1) {
      throw new HttpsError('failed-precondition', `Transition ${from} → ${toPhase} non autorisée.`);
    }
    tx.update(ref, { phase: toPhase, updatedAt: FieldValue.serverTimestamp() });
    return { from };
  });

  await writeAudit({
    actor: { uid: req.auth!.uid, claims: c },
    action: 'advance_campaign_phase', resource: 'objectiveCampaigns', resourceId: campaignId,
    before: { phase: result.from }, after: { phase: toPhase },
  });
  return { ok: true };
});
