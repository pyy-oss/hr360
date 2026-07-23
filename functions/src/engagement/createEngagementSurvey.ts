import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../lib/admin';
import { assertRole } from '../lib/rbac';
import { writeAudit } from '../lib/audit';
import { FieldValue } from 'firebase-admin/firestore';

const Schema = z.object({
  title: z.string().min(1),
  questions: z.array(z.object({ key: z.string().min(1), label: z.string().min(1) })).min(1).max(15),
});

/** Crée une enquête d'engagement (statut 'ouverte'). Réservé RH/DRH. Audit. */
export const createEngagementSurvey = onCall(async (req) => {
  const c = assertRole(req, ['super_admin', 'drh', 'rh']);
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', p.error.issues[0]?.message ?? 'Enquête invalide.');

  // Clés de question uniques.
  const keys = p.data.questions.map((q) => q.key);
  if (new Set(keys).size !== keys.length) throw new HttpsError('invalid-argument', 'Clés de question en double.');

  const ref = db.collection('engagementSurveys').doc();
  await ref.set({
    orgId: c.orgId, title: p.data.title, questions: p.data.questions, status: 'ouverte',
    createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
  });

  await writeAudit({
    actor: { uid: req.auth!.uid, claims: c },
    action: 'create_engagement_survey', resource: 'engagementSurveys', resourceId: ref.id,
    after: { title: p.data.title, questions: keys.length },
  });
  return { ok: true, id: ref.id };
});
