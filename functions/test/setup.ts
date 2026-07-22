import functionsTest from 'firebase-functions-test';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

// `firebase emulators:exec` injecte FIRESTORE_EMULATOR_HOST et FIREBASE_AUTH_EMULATOR_HOST.
// On fixe le projet par défaut si absent.
process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT || 'neurones-hr-360-test';

// Environnement firebase-functions-test (mode hors-ligne : on « wrap » les handlers).
export const fft = functionsTest();

if (getApps().length === 0) initializeApp({ projectId: process.env.GCLOUD_PROJECT });
export const db = getFirestore();

export const ORG = 'neurones';

/** Construit une requête callable v2 avec des custom claims. */
export function reqOf(
  data: unknown,
  claims: { role: string; employeeId?: string; departmentId?: string },
  uid = 'u_test',
) {
  return { data, auth: { uid, token: { orgId: ORG, ...claims } } } as any;
}

/** Vide l'émulateur Firestore entre les tests. */
export async function clearFirestore() {
  const pid = process.env.GCLOUD_PROJECT;
  const host = process.env.FIRESTORE_EMULATOR_HOST;
  if (!host) throw new Error('Émulateur Firestore requis (lancer via npm run test:functions).');
  await fetch(`http://${host}/emulator/v1/projects/${pid}/databases/(default)/documents`, { method: 'DELETE' });
}

/** Compte les documents d'une collection (petits volumes de test). */
export async function count(coll: string): Promise<number> {
  const snap = await db.collection(coll).get();
  return snap.size;
}
