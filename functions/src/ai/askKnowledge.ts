import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import type Anthropic from '@anthropic-ai/sdk';
import { db } from '../lib/admin';
import { getClaims } from '../lib/rbac';
import { getAnthropic, AI_MODEL, ANTHROPIC_API_KEY } from './client';
import { logAiInvocation } from './governance';

const Schema = z.object({ question: z.string().min(1).max(2000) });

const SYSTEM = `Tu réponds aux questions de politique RH de Neurones Technologies en t'appuyant EXCLUSIVEMENT sur les documents internes fournis (règlement, convention, procédures, notes RH).

Règles impératives :
- Réponds en français, de façon concise.
- Utilise UNIQUEMENT le contenu des documents fournis. Si la réponse ne s'y trouve pas, dis clairement « Je ne trouve pas cette information dans la base de connaissances » et invite à consulter la DRH. N'invente jamais.
- Cite tes sources (le mécanisme de citation est activé sur les documents).
- Pour tout point à portée juridique, ajoute que la DRH / le juriste doit confirmer avant application.`;

/**
 * Base de connaissances RH avec RAG CITÉ (citations natives de l'API Claude).
 * Chaque document interne est passé en bloc `document` avec citations activées :
 * la réponse est ancrée dans les sources et refuse si l'info n'y figure pas.
 * Accessible à tout utilisateur authentifié. Journalisé (gouvernance).
 */
export const askKnowledge = onCall({ secrets: [ANTHROPIC_API_KEY] }, async (req) => {
  const c = getClaims(req);
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', 'Question invalide.');

  const snap = await db.collection('knowledgeDocs').where('orgId', '==', c.orgId).limit(50).get();
  if (snap.empty) {
    return { ok: true, text: "La base de connaissances est vide : aucun document interne n'a encore été ajouté.", citations: [], docCount: 0 };
  }

  // Chaque document devient un bloc `document` citable.
  const docBlocks = snap.docs.map((d) => ({
    type: 'document',
    source: { type: 'text', media_type: 'text/plain', data: String(d.get('content') ?? '') },
    title: String(d.get('title') ?? 'Document'),
    citations: { enabled: true },
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const params: any = {
    model: AI_MODEL,
    max_tokens: 2048,
    system: SYSTEM,
    messages: [{ role: 'user', content: [...docBlocks, { type: 'text', text: p.data.question }] }],
  };

  const started = Date.now();
  try {
    const resp = (await getAnthropic().messages.create(params)) as Anthropic.Message;
    let text = '';
    const citations: { title: string; quote: string }[] = [];
    for (const block of resp.content) {
      if (block.type === 'text') {
        text += block.text;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const cit of ((block as any).citations ?? [])) {
          const title = cit.document_title ?? 'Document';
          const quote = cit.cited_text ?? '';
          if (quote && !citations.some((x) => x.quote === quote)) citations.push({ title, quote });
        }
      }
    }
    await logAiInvocation({
      actor: { uid: req.auth!.uid, claims: c }, feature: 'knowledge', model: AI_MODEL,
      usage: resp.usage, latencyMs: Date.now() - started, ok: true, meta: { docs: snap.size, citations: citations.length },
    });
    return { ok: true, text: text.trim(), citations, docCount: snap.size };
  } catch (e) {
    await logAiInvocation({
      actor: { uid: req.auth!.uid, claims: c }, feature: 'knowledge', model: AI_MODEL,
      latencyMs: Date.now() - started, ok: false, error: (e as Error).message,
    });
    throw new HttpsError('internal', 'La base de connaissances est momentanément indisponible.');
  }
});
