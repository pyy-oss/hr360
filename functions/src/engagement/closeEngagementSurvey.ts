import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../lib/admin';
import { assertRole, assertSameOrg } from '../lib/rbac';
import { writeAudit } from '../lib/audit';
import { FieldValue } from 'firebase-admin/firestore';

const Schema = z.object({ surveyId: z.string().min(1) });

/** Ferme une enquête d'engagement (plus de réponses acceptées). Réservé RH/DRH. Audit. */
export const closeEngagementSurvey = onCall(async (req) => {
  const c = assertRole(req, ['super_admin', 'drh', 'rh']);
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', 'Requête invalide.');

  const ref = db.doc(`engagementSurveys/${p.data.surveyId}`);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Enquête introuvable.');
  assertSameOrg(c, snap.get('orgId'));
  if (snap.get('status') !== 'ouverte') throw new HttpsError('failed-precondition', 'Enquête déjà fermée.');

  await ref.update({ status: 'fermee', updatedAt: FieldValue.serverTimestamp() });
  await writeAudit({
    actor: { uid: req.auth!.uid, claims: c },
    action: 'close_engagement_survey', resource: 'engagementSurveys', resourceId: p.data.surveyId,
    before: { status: 'ouverte' }, after: { status: 'fermee' },
  });
  return { ok: true };
});
