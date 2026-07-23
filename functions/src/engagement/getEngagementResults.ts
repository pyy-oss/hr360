import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../lib/admin';
import { assertRole, assertSameOrg } from '../lib/rbac';

const Schema = z.object({ surveyId: z.string().min(1) });

// Seuil d'anonymat : en-dessous, on ne renvoie pas de moyennes (ré-identification possible).
const MIN_RESPONSES = 3;

/**
 * Renvoie les résultats AGRÉGÉS d'une enquête (moyennes par question). Réservé RH/DRH.
 * Jamais de réponse individuelle. Sous le seuil d'anonymat, les moyennes sont masquées.
 */
export const getEngagementResults = onCall(async (req) => {
  const c = assertRole(req, ['super_admin', 'drh', 'rh']);
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', 'Requête invalide.');

  const survey = await db.doc(`engagementSurveys/${p.data.surveyId}`).get();
  if (!survey.exists) throw new HttpsError('not-found', 'Enquête introuvable.');
  assertSameOrg(c, survey.get('orgId'));

  const questions = (survey.get('questions') as { key: string; label: string }[]) ?? [];
  const snap = await db.collection('engagementResponses').where('surveyId', '==', p.data.surveyId).limit(5000).get();
  const responseCount = snap.size;

  const sums: Record<string, { total: number; count: number }> = {};
  for (const q of questions) sums[q.key] = { total: 0, count: 0 };
  snap.forEach((d) => {
    const scores = (d.get('scores') as Record<string, number>) ?? {};
    for (const q of questions) {
      const v = scores[q.key];
      if (typeof v === 'number') { sums[q.key].total += v; sums[q.key].count += 1; }
    }
  });

  const belowThreshold = responseCount < MIN_RESPONSES;
  const perQuestion = questions.map((q) => ({
    key: q.key, label: q.label,
    avg: belowThreshold || sums[q.key].count === 0 ? null
      : Math.round((sums[q.key].total / sums[q.key].count) * 10) / 10,
    count: sums[q.key].count,
  }));

  return {
    ok: true, responseCount, minResponses: MIN_RESPONSES, belowThreshold,
    status: survey.get('status'), title: survey.get('title'), perQuestion,
  };
});
