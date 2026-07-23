import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import type Anthropic from '@anthropic-ai/sdk';
import { getClaims } from '../lib/rbac';
import { getAnthropic, AI_MODEL, ANTHROPIC_API_KEY, textOf } from './client';
import { logAiInvocation } from './governance';
import { assertAndCountAiQuota } from './quota';

const Schema = z.object({
  message: z.string().min(1).max(4000),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1).max(8000),
  })).max(20).optional(),
});

const SYSTEM = `Tu es l'assistant RH interne de Neurones Technologies (société de services IT & cybersécurité, Abidjan, zone UEMOA/CEMAC), intégré à l'application Neurones HR 360.

Rôle : aider les managers et la RH à comprendre les processus RH, les modules de l'outil (absences & congés, formation, objectifs & évaluations, staffing, recrutement, rémunération, offboarding, engagement) et à formuler leurs demandes.

Règles impératives :
- Réponds en français, de façon concise et actionnable.
- Tu N'AS PAS accès aux données nominatives en direct dans cette conversation. Ne fabrique JAMAIS de chiffres, de noms de collaborateurs, de scores ou de statuts. Si une donnée précise est demandée, explique où la trouver dans l'application (l'écran/module concerné) plutôt que d'inventer.
- Tu n'es qu'une aide : tu ne prends AUCUNE décision RH. Toute décision à impact (congé, évaluation, rémunération, départ) revient à un humain habilité via le module concerné.
- Rappelle la conformité ARTCI quand c'est pertinent (minimisation, traçabilité, révision humaine).
- Si tu n'es pas sûr, dis-le et oriente vers la RH — n'invente pas de politique interne.`;

/**
 * Assistant RH conversationnel. Accessible à tout utilisateur authentifié (avec rôle).
 * L'appel Claude passe par le serveur (clé en secret). Chaque appel est journalisé
 * dans aiInvocations (gouvernance). Aucune donnée nominative n'est transmise ici.
 */
export const aiAssistant = onCall({ secrets: [ANTHROPIC_API_KEY] }, async (req) => {
  const c = getClaims(req);
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', 'Message invalide.');

  const messages: Anthropic.MessageParam[] = [
    ...(p.data.history ?? []).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: p.data.message },
  ];

  await assertAndCountAiQuota(req.auth!.uid, c.orgId);
  const started = Date.now();
  try {
    const resp = await getAnthropic().messages.create({
      model: AI_MODEL,
      max_tokens: 2048,
      thinking: { type: 'adaptive' },
      system: SYSTEM,
      messages,
    });
    await logAiInvocation({
      actor: { uid: req.auth!.uid, claims: c }, feature: 'assistant', model: AI_MODEL,
      usage: resp.usage, latencyMs: Date.now() - started, ok: true,
    });
    return { ok: true, text: textOf(resp.content) };
  } catch (e) {
    await logAiInvocation({
      actor: { uid: req.auth!.uid, claims: c }, feature: 'assistant', model: AI_MODEL,
      latencyMs: Date.now() - started, ok: false, error: (e as Error).message,
    });
    throw new HttpsError('internal', "L'assistant est momentanément indisponible.");
  }
});
