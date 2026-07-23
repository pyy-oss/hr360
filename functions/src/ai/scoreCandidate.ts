import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { z } from 'zod';
import type Anthropic from '@anthropic-ai/sdk';
import { db } from '../lib/admin';
import { getClaims, assertSameOrg, Claims } from '../lib/rbac';
import { getAnthropic, AI_MODEL, ANTHROPIC_API_KEY, textOf } from './client';
import { logAiInvocation } from './governance';

const Schema = z.object({ candidateId: z.string().min(1), positionId: z.string().min(1) });

function assertRecruiter(req: CallableRequest, departmentId?: unknown): Claims {
  const c = getClaims(req);
  const isHR = ['super_admin', 'drh', 'rh'].includes(c.role);
  const isMgr = c.role === 'manager' && !!departmentId && c.departmentId === departmentId;
  if (!isHR && !isMgr) throw new HttpsError('permission-denied', 'Réservé à la RH ou au manager du département.');
  return c;
}

const SYSTEM = `Tu évalues l'ADÉQUATION PROFESSIONNELLE d'un candidat à un poste, pour aider un recruteur humain.

Contraintes ARTCI (impératives) :
- Tu ne reçois AUCUNE donnée d'identité (nom, âge, genre, origine, photo). Ne les demande pas, ne les infère pas, ne les évoque pas.
- Score UNIQUEMENT sur l'expérience, les compétences déclarées et l'adéquation aux exigences du poste.
- Ton évaluation est une AIDE À LA DÉCISION, jamais une décision. Reste factuel, explicite chaque note, signale les incertitudes.
- Si l'information est insuffisante, dis-le (note prudente) plutôt que d'inventer.`;

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    score: { type: 'integer', description: 'Score global 0-100 d’adéquation professionnelle' },
    summary: { type: 'string', description: 'Synthèse en 1-2 phrases' },
    axes: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          axis: { type: 'string' },
          score: { type: 'integer' },
          rationale: { type: 'string' },
        },
        required: ['axis', 'score', 'rationale'],
      },
    },
    mustHaveGaps: { type: 'array', items: { type: 'string' } },
  },
  required: ['score', 'summary', 'axes', 'mustHaveGaps'],
} as const;

/**
 * Score d'adéquation candidat↔poste (aide à la décision, human-in-the-loop).
 * N'envoie AU MODÈLE que des données professionnelles (expérience, tags, notes) et
 * les exigences du poste — jamais l'identité. N'écrit pas le score : le recruteur
 * décide. Journalisé (gouvernance).
 */
export const scoreCandidate = onCall({ secrets: [ANTHROPIC_API_KEY] }, async (req) => {
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', 'Requête invalide.');

  const [candSnap, posSnap] = await Promise.all([
    db.doc(`candidates/${p.data.candidateId}`).get(),
    db.doc(`positions/${p.data.positionId}`).get(),
  ]);
  if (!candSnap.exists) throw new HttpsError('not-found', 'Candidat introuvable.');
  if (!posSnap.exists) throw new HttpsError('not-found', 'Poste introuvable.');

  const c = assertRecruiter(req, candSnap.get('departmentId'));
  assertSameOrg(c, candSnap.get('orgId'));
  assertSameOrg(c, posSnap.get('orgId'));

  // Données STRICTEMENT professionnelles (aucune identité).
  const candidate = {
    yearsExperience: candSnap.get('yearsExperience') ?? 0,
    tags: candSnap.get('tags') ?? [],
    notes: candSnap.get('notes') ?? '',
    source: candSnap.get('source') ?? '',
  };
  const position = {
    title: posSnap.get('title'),
    level: posSnap.get('level'),
    mustSkills: posSnap.get('mustSkills') ?? [],
    niceSkills: posSnap.get('niceSkills') ?? [],
    weights: posSnap.get('weights') ?? null,
    excludedCriteria: posSnap.get('excludedCriteria') ?? [],
  };

  const userPrompt = `POSTE :\n${JSON.stringify(position, null, 2)}\n\nCANDIDAT (données professionnelles uniquement) :\n${JSON.stringify(candidate, null, 2)}\n\nÉvalue l'adéquation professionnelle. Décompose par axe (technique, expérience, soft skills, formation si pertinent). Liste les compétences éliminatoires (MUST) non couvertes. Les critères exclus (${(position.excludedCriteria as string[]).join(', ') || 'aucun'}) ne doivent JAMAIS peser.`;

  // output_config (structured outputs) n'est pas encore typé dans tous les SDK :
  // on construit les paramètres en `any` puis on retype la réponse en Message.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const params: any = {
    model: AI_MODEL,
    max_tokens: 2048,
    system: SYSTEM,
    output_config: { format: { type: 'json_schema', schema: SCHEMA } },
    messages: [{ role: 'user', content: userPrompt }],
  };

  const started = Date.now();
  try {
    const resp = (await getAnthropic().messages.create(params)) as Anthropic.Message;
    const parsed = JSON.parse(textOf(resp.content));
    await logAiInvocation({
      actor: { uid: req.auth!.uid, claims: c }, feature: 'scoring', model: AI_MODEL,
      usage: resp.usage, latencyMs: Date.now() - started, ok: true,
      meta: { candidateId: p.data.candidateId, positionId: p.data.positionId, score: parsed.score },
    });
    return { ok: true, result: parsed };
  } catch (e) {
    await logAiInvocation({
      actor: { uid: req.auth!.uid, claims: c }, feature: 'scoring', model: AI_MODEL,
      latencyMs: Date.now() - started, ok: false, error: (e as Error).message,
    });
    throw new HttpsError('internal', "Le scoring est momentanément indisponible.");
  }
});
