import { db } from '../lib/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { Claims } from '../lib/rbac';

/**
 * Journalise CHAQUE appel IA dans `aiInvocations` (gouvernance / conformité ARTCI).
 * Minimisation : on n'enregistre PAS le prompt ni la réponse — seulement les
 * métadonnées (qui, quelle fonction, quel modèle, coût en tokens, latence, succès).
 * Alimente l'écran « Gouvernance de l'IA ».
 */
export async function logAiInvocation(p: {
  actor: { uid: string; claims: Claims };
  feature: string;
  model: string;
  usage?: { input_tokens?: number; output_tokens?: number } | null;
  latencyMs: number;
  ok: boolean;
  error?: string;
  meta?: Record<string, unknown>;
}) {
  await db.collection('aiInvocations').add({
    orgId: p.actor.claims.orgId,
    actorUid: p.actor.uid,
    actorRole: p.actor.claims.role,
    feature: p.feature,
    model: p.model,
    inputTokens: p.usage?.input_tokens ?? null,
    outputTokens: p.usage?.output_tokens ?? null,
    latencyMs: p.latencyMs,
    ok: p.ok,
    error: p.error ?? null,
    meta: p.meta ?? null,
    at: FieldValue.serverTimestamp(),
  });
}
