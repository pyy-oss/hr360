import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../lib/admin';
import { getClaims, assertSameOrg } from '../lib/rbac';
import { FieldValue } from 'firebase-admin/firestore';

const Schema = z.object({
  surveyId: z.string().min(1),
  scores: z.record(z.string(), z.number().int().min(1).max(5)),
});

/**
 * Soumet une réponse ANONYME à une enquête d'engagement.
 *
 * Anonymat by design : l'identité et le contenu sont stockés SÉPARÉMENT.
 * - un marqueur `engagementVotes/{surveyId}__{uid}` (sans scores) empêche le double vote ;
 * - la réponse `engagementResponses/{auto}` ne contient QUE surveyId + scores (aucun uid).
 * Aucun log d'audit n'est écrit ici (il tracerait l'uid → romprait l'anonymat).
 * Les deux écritures sont faites dans une transaction.
 */
export const submitEngagementResponse = onCall(async (req) => {
  const c = getClaims(req);
  const uid = req.auth!.uid;
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', 'Réponse invalide.');
  const { surveyId, scores } = p.data;

  const surveyRef = db.doc(`engagementSurveys/${surveyId}`);
  const voteRef = db.doc(`engagementVotes/${surveyId}__${uid}`);
  const respRef = db.collection('engagementResponses').doc();

  await db.runTransaction(async (tx) => {
    const survey = await tx.get(surveyRef);
    if (!survey.exists) throw new HttpsError('not-found', 'Enquête introuvable.');
    assertSameOrg(c, survey.get('orgId'));
    if (survey.get('status') !== 'ouverte') throw new HttpsError('failed-precondition', 'Enquête fermée.');

    // Les clés de score doivent correspondre aux questions de l'enquête.
    const validKeys = new Set((survey.get('questions') as { key: string }[]).map((q) => q.key));
    for (const k of Object.keys(scores)) {
      if (!validKeys.has(k)) throw new HttpsError('invalid-argument', `Question inconnue : ${k}.`);
    }

    const vote = await tx.get(voteRef);
    if (vote.exists) throw new HttpsError('already-exists', 'Vous avez déjà répondu à cette enquête.');

    // Marqueur d'identité — sans scores.
    tx.set(voteRef, { orgId: c.orgId, surveyId, votedAt: FieldValue.serverTimestamp() });
    // Réponse anonyme — sans identité.
    tx.set(respRef, { orgId: c.orgId, surveyId, scores, submittedAt: FieldValue.serverTimestamp() });
  });

  return { ok: true };
});
