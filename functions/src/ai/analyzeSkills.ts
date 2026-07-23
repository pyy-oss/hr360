import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import type Anthropic from '@anthropic-ai/sdk';
import { db } from '../lib/admin';
import { assertRole } from '../lib/rbac';
import { getAnthropic, AI_MODEL, ANTHROPIC_API_KEY, textOf } from './client';
import { logAiInvocation } from './governance';

const Schema = z.object({}).optional();

const SYSTEM = `Tu es un analyste stratégique RH qui aide une DRH à cartographier les COMPÉTENCES et anticiper les pénuries.

Contraintes :
- Tu ne reçois QUE des agrégats organisationnels (compétences demandées par les postes ouverts, besoins de formation identifiés, catalogue interne). Aucune donnée nominative.
- Ton analyse est une AIDE À LA DÉCISION collective. Pour chaque compétence en tension, recommande « former » (montée en compétence interne), « recruter », ou « mixte », avec une justification courte.
- Reste factuel, appuie-toi sur les agrégats fournis, n'invente pas de chiffres.`;

const SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    summary: { type: 'string' },
    gaps: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        properties: { skill: { type: 'string' }, tension: { type: 'string', enum: ['forte', 'moyenne', 'couverte'] }, note: { type: 'string' } },
        required: ['skill', 'tension', 'note'],
      },
    },
    recommendations: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        properties: { skill: { type: 'string' }, approach: { type: 'string', enum: ['former', 'recruter', 'mixte'] }, note: { type: 'string' } },
        required: ['skill', 'approach', 'note'],
      },
    },
  },
  required: ['summary', 'gaps', 'recommendations'],
} as const;

/**
 * Analyse de l'écart de compétences (aide à la décision DRH/RH). Croise, au niveau
 * AGRÉGÉ, les compétences demandées par les postes ouverts, les besoins de formation
 * et la couverture du catalogue interne. Aucune donnée nominative. Journalisé.
 */
export const analyzeSkills = onCall({ secrets: [ANTHROPIC_API_KEY] }, async (req) => {
  const c = assertRole(req, ['super_admin', 'drh', 'rh']);
  const parsed = Schema.safeParse(req.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'Requête invalide.');
  const orgId = c.orgId;

  const [positions, needs, catalog] = await Promise.all([
    db.collection('positions').where('orgId', '==', orgId).where('status', '==', 'ouvert').limit(200).get(),
    db.collection('trainingNeeds').where('orgId', '==', orgId).limit(200).get(),
    db.collection('trainingCatalog').where('orgId', '==', orgId).limit(100).get(),
  ]);

  // Fréquence des compétences demandées par les postes ouverts.
  const demand: Record<string, number> = {};
  positions.forEach((d) => {
    for (const s of [...(d.get('mustSkills') ?? []), ...(d.get('niceSkills') ?? [])]) {
      demand[s] = (demand[s] ?? 0) + 1;
    }
  });
  const trainingNeeds = needs.docs.map((d) => ({ skill: d.get('skill'), priority: d.get('priority'), department: d.get('departmentId') }));
  const catalogCoverage = catalog.docs.map((d) => d.get('name'));

  const aggregates = {
    demandedSkills: demand,
    openPositions: positions.size,
    trainingNeeds,
    catalogCoverage,
  };

  const userPrompt = `Agrégats de compétences de l'organisation :\n${JSON.stringify(aggregates, null, 2)}\n\nIdentifie les compétences en tension (demande forte peu couverte par le catalogue ou signalée en besoin de formation) et recommande, pour chacune, une approche « former / recruter / mixte » avec justification.`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const params: any = {
    model: AI_MODEL, max_tokens: 2048, system: SYSTEM,
    output_config: { format: { type: 'json_schema', schema: SCHEMA } },
    messages: [{ role: 'user', content: userPrompt }],
  };

  const started = Date.now();
  try {
    const resp = (await getAnthropic().messages.create(params)) as Anthropic.Message;
    const result = JSON.parse(textOf(resp.content));
    await logAiInvocation({
      actor: { uid: req.auth!.uid, claims: c }, feature: 'skills', model: AI_MODEL,
      usage: resp.usage, latencyMs: Date.now() - started, ok: true, meta: { gaps: result.gaps?.length ?? 0 },
    });
    return { ok: true, result, aggregates };
  } catch (e) {
    await logAiInvocation({
      actor: { uid: req.auth!.uid, claims: c }, feature: 'skills', model: AI_MODEL,
      latencyMs: Date.now() - started, ok: false, error: (e as Error).message,
    });
    throw new HttpsError('internal', "L'analyse des compétences est momentanément indisponible.");
  }
});
