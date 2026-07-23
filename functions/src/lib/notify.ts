import { db } from './admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Écrit une notification pour un destinataire, de façon IDEMPOTENTE (l'id doit être
 * déterministe : un même événement ne notifie qu'une fois, même en cas de rejeu du
 * trigger). Lecture/màj réservées au destinataire (voir firestore.rules).
 */
export async function notify(params: {
  id: string;
  orgId: string;
  toUid: string;
  type: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  const ref = db.doc(`notifications/${params.id}`);
  const existing = await ref.get();
  if (existing.exists) return;
  await ref.set({
    orgId: params.orgId,
    toUid: params.toUid,
    type: params.type,
    payload: params.payload ?? {},
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });
}
