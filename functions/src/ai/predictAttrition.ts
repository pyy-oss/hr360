import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import type Anthropic from '@anthropic-ai/sdk';
import { db } from '../lib/admin';
import { assertRole } from '../lib/rbac';
import { getAnthropic, AI_MODEL, ANTHROPIC_API_KEY, textOf } from './client';
import { logAiInvocation } from './governance';
import { assertAndCountAiQuota } from './quota';

const Schema = z.object({}).optional();

const SYSTEM = `Tu es un analyste RH qui aide une DRH à anticiper le RISQUE DE RÉTENTION au niveau AGRÉGÉ.

Contraintes impératives (ARTCI, éthique) :
- Tu ne reçois QUE des agrégats anonymes (effectifs, comptages, moyennes). Aucune donnée nominative. Ne cherche jamais à identifier un individu.
- Ton analyse est une AIDE À LA DÉCISION collective : elle déclenche des actions de SOUTIEN (échange carrière, plan de formation, revue de charge), JAMAIS une mesure défavorable.
- Reste factuel et prudent : ce sont des signaux, pas des certitudes. N'invente pas de chiffres.`;

const SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    riskLevel: { type: 'string', enum: ['faible', 'modere', 'eleve'] },
    factors: {
      type: 'array',
      items: { type: 'object', additionalProperties: false, properties: { factor: { type: 'string' }, note: { type: 'string' } }, required: ['factor', 'note'] },
    },
    actions: {
      type: 'array',
      items: { type: 'object', additionalProperties: false, properties: { action: { type: 'string' }, note: { type: 'string' } }, required: ['action', 'note'] },
    },
    caveat: { type: 'string' },
  },
  required: ['riskLevel', 'factors', 'actions', 'caveat'],
} as const;

/**
 * Analyse de risque de rétention au niveau AGRÉGÉ et ANONYME (aide à la décision DRH).
 * Calcule des agrégats côté serveur (effectifs, départs en cours, congés, engagement)
 * — aucune donnée nominative n'est transmise. Journalisé (gouvernance).
 */
export const predictAttrition = onCall({ secrets: [ANTHROPIC_API_KEY] }, async (req) => {
  const c = assertRole(req, ['super_admin', 'drh', 'dirigeant']);
  const parsed = Schema.safeParse(req.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'Requête invalide.');
  const orgId = c.orgId;

  // --- Agrégats anonymes calculés côté serveur ---
  const [emps, offb, leave, pos, surveys] = await Promise.all([
    db.collection('employees').where('orgId', '==', orgId).limit(1000).get(),
    db.collection('offboardings').where('orgId', '==', orgId).where('status', '==', 'en_cours').limit(500).get(),
    db.collection('leaveRequests').where('orgId', '==', orgId).where('status', 'in', ['soumis', 'valide_manager']).limit(500).get(),
    db.collection('positions').where('orgId', '==', orgId).where('status', '==', 'ouvert').limit(200).get(),
    db.collection('engagementSurveys').where('orgId', '==', orgId).orderBy('createdAt', 'desc').limit(1).get(),
  ]);

  const byStatus: Record<string, number> = { essai: 0, confirme: 0, sortant: 0 };
  emps.forEach((d) => { const s = d.get('status') as string; if (s in byStatus) byStatus[s] += 1; });

  // Engagement : moyennes anonymes de la dernière enquête (si ≥ 3 réponses).
  let engagement: { question: string; avg: number }[] | null = null;
  let responseCount = 0;
  if (!surveys.empty) {
    const survey = surveys.docs[0];
    const questions = (survey.get('questions') as { key: string; label: string }[]) ?? [];
    const resp = await db.collection('engagementResponses').where('surveyId', '==', survey.id).limit(5000).get();
    responseCount = resp.size;
    if (responseCount >= 3) {
      engagement = questions.map((q) => {
        let total = 0; let n = 0;
        resp.forEach((r) => { const v = (r.get('scores') as Record<string, number>)?.[q.key]; if (typeof v === 'number') { total += v; n += 1; } });
        return { question: q.label, avg: n ? Math.round((total / n) * 10) / 10 : 0 };
      });
    }
  }

  const aggregates = {
    headcount: emps.size,
    byStatus,
    departuresInProgress: offb.size,
    pendingLeaveRequests: leave.size,
    openPositions: pos.size,
    engagement: engagement ?? 'insuffisant (< 3 réponses ou aucune enquête)',
    engagementResponses: responseCount,
  };

  const userPrompt = `Agrégats RH anonymes de l'organisation :\n${JSON.stringify(aggregates, null, 2)}\n\nÉvalue le niveau de risque de rétention global, les facteurs de risque plausibles à ce niveau agrégé, et des actions de SOUTIEN concrètes. Rappelle en caveat que ce sont des signaux collectifs, jamais un verdict individuel.`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const params: any = {
    model: AI_MODEL,
    max_tokens: 2048,
    system: SYSTEM,
    output_config: { format: { type: 'json_schema', schema: SCHEMA } },
    messages: [{ role: 'user', content: userPrompt }],
  };

  await assertAndCountAiQuota(req.auth!.uid, c.orgId);
  const started = Date.now();
  try {
    const resp = (await getAnthropic().messages.create(params)) as Anthropic.Message;
    const result = JSON.parse(textOf(resp.content));
    await logAiInvocation({
      actor: { uid: req.auth!.uid, claims: c }, feature: 'prediction', model: AI_MODEL,
      usage: resp.usage, latencyMs: Date.now() - started, ok: true, meta: { riskLevel: result.riskLevel },
    });
    return { ok: true, result, aggregates };
  } catch (e) {
    await logAiInvocation({
      actor: { uid: req.auth!.uid, claims: c }, feature: 'prediction', model: AI_MODEL,
      latencyMs: Date.now() - started, ok: false, error: (e as Error).message,
    });
    throw new HttpsError('internal', "L'analyse de rétention est momentanément indisponible.");
  }
});
