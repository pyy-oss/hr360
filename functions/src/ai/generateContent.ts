import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import type Anthropic from '@anthropic-ai/sdk';
import { db } from '../lib/admin';
import { assertSameOrg, getClaims } from '../lib/rbac';
import { getAnthropic, AI_MODEL, ANTHROPIC_API_KEY, textOf } from './client';
import { logAiInvocation } from './governance';

const Schema = z.object({
  kind: z.enum(['offre', 'fiche_poste', 'compte_rendu', 'reponse_candidat', 'communication', 'lettre_embauche']),
  positionId: z.string().optional(),
  brief: z.string().max(4000).optional(),
  tone: z.enum(['neutre', 'chaleureux', 'formel']).optional(),
});

const KIND_INSTRUCTION: Record<string, string> = {
  offre: "Rédige une offre d'emploi attractive et inclusive.",
  fiche_poste: 'Rédige une fiche de poste structurée (missions, compétences, niveau).',
  compte_rendu: "Rédige un compte-rendu d'entretien structuré à partir des notes fournies.",
  reponse_candidat: 'Rédige une réponse au candidat (acceptation ou refus) avec tact et respect.',
  communication: 'Rédige une communication RH interne claire.',
  lettre_embauche: "Rédige une lettre d'embauche professionnelle.",
};

const SYSTEM = `Tu es un assistant de rédaction RH pour Neurones Technologies (Abidjan, UEMOA/CEMAC).
Écris en français, clair et professionnel. Le texte produit est un BROUILLON destiné à être relu et validé par un humain avant tout usage.
Contraintes : formulations INCLUSIVES et non discriminatoires (pas de mention d'âge, genre, origine, situation familiale) ; n'invente pas de faits, de chiffres ni d'engagements ; si une information manque, laisse un champ à compléter entre crochets.`;

/**
 * Studio de génération de contenu RH (offres, courriers, comptes-rendus…).
 * Réservé RH/DRH/manager. Le texte est un brouillon (human-in-the-loop) — rien
 * n'est publié ni envoyé. Journalisé (gouvernance).
 */
export const generateContent = onCall({ secrets: [ANTHROPIC_API_KEY] }, async (req) => {
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', 'Requête invalide.');
  const { kind, positionId, brief, tone } = p.data;

  const claims = getClaims(req);
  if (!['super_admin', 'drh', 'rh', 'manager'].includes(claims.role)) {
    throw new HttpsError('permission-denied', 'Réservé à la RH ou aux managers.');
  }

  let grounding = '';
  if (positionId) {
    const pos = await db.doc(`positions/${positionId}`).get();
    if (!pos.exists) throw new HttpsError('not-found', 'Poste introuvable.');
    assertSameOrg(claims, pos.get('orgId'));
    grounding = `\n\nRÉFÉRENTIEL DE POSTE :\n${JSON.stringify({
      title: pos.get('title'), level: pos.get('level'), contractType: pos.get('contractType'),
      mustSkills: pos.get('mustSkills') ?? [], niceSkills: pos.get('niceSkills') ?? [],
    }, null, 2)}`;
  }

  const userPrompt = `${KIND_INSTRUCTION[kind]}${tone ? ` Ton : ${tone}.` : ''}${brief ? `\n\nÉLÉMENTS FOURNIS :\n${brief}` : ''}${grounding}`;

  const params = {
    model: AI_MODEL,
    max_tokens: 2048,
    thinking: { type: 'adaptive' as const },
    system: SYSTEM,
    messages: [{ role: 'user' as const, content: userPrompt }],
  } satisfies Anthropic.MessageCreateParamsNonStreaming;

  const started = Date.now();
  try {
    const resp = await getAnthropic().messages.create(params);
    await logAiInvocation({
      actor: { uid: req.auth!.uid, claims }, feature: 'generation', model: AI_MODEL,
      usage: resp.usage, latencyMs: Date.now() - started, ok: true, meta: { kind },
    });
    return { ok: true, text: textOf(resp.content) };
  } catch (e) {
    await logAiInvocation({
      actor: { uid: req.auth!.uid, claims }, feature: 'generation', model: AI_MODEL,
      latencyMs: Date.now() - started, ok: false, error: (e as Error).message, meta: { kind },
    });
    throw new HttpsError('internal', 'La génération est momentanément indisponible.');
  }
});
