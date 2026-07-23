import { HttpsError } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../lib/admin';

/** Quota d'appels IA par utilisateur et par jour (garde-fou anti-abus / coût). */
export const AI_DAILY_LIMIT = 50;

/**
 * Vérifie et incrémente le compteur journalier d'appels IA de l'utilisateur, de
 * façon transactionnelle. Lève `resource-exhausted` si la limite est atteinte.
 * À appeler APRÈS la garde de rôle et AVANT l'appel modèle (l'appel a un coût).
 * Le compteur se réinitialise chaque jour (id = `${uid}_${YYYY-MM-DD}`).
 */
export async function assertAndCountAiQuota(uid: string, orgId: string): Promise<void> {
  const day = new Date().toISOString().slice(0, 10);
  const ref = db.doc(`aiQuota/${uid}_${day}`);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const count = snap.exists ? ((snap.get('count') as number) ?? 0) : 0;
    if (count >= AI_DAILY_LIMIT) {
      throw new HttpsError('resource-exhausted', `Quota IA journalier atteint (${AI_DAILY_LIMIT} requêtes). Réessayez demain.`);
    }
    tx.set(ref, { orgId, uid, day, count: count + 1, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  });
}
