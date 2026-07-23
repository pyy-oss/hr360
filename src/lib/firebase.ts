import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, httpsCallable, type HttpsCallable } from 'firebase/functions';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});

// App Check (défense en profondeur contre l'abus d'API). Activé dès qu'une clé de
// site reCAPTCHA v3 est fournie (clé PUBLIQUE, ok à embarquer). En dev/emulateur,
// poser VITE_APPCHECK_DEBUG_TOKEN=true active le jeton de debug. Sans clé, on
// n'initialise rien : l'app fonctionne, l'autorité reste les règles + fonctions.
const APPCHECK_KEY = import.meta.env.VITE_APPCHECK_SITE_KEY;
if (APPCHECK_KEY) {
  if (import.meta.env.VITE_APPCHECK_DEBUG_TOKEN) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.VITE_APPCHECK_DEBUG_TOKEN;
  }
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(APPCHECK_KEY),
    isTokenAutoRefreshEnabled: true,
  });
}

// Projet Firebase PARTAGÉ : hr360 est isolé des autres applications par des ressources
// dédiées — une base Firestore NOMMÉE (jamais la base '(default)'), un bucket Storage
// dédié (VITE_FIREBASE_STORAGE_BUCKET) et des fonctions en europe-west1.
// Tout est piloté par l'environnement : migrer vers un projet dédié plus tard ne
// demandera que de changer le .env (DB_ID -> '(default)', nouveau projet/bucket), sans
// toucher au code applicatif.
const DB_ID = import.meta.env.VITE_FIREBASE_DB_ID || 'hr360';
const REGION = import.meta.env.VITE_FIREBASE_REGION || 'europe-west1';

export const auth = getAuth(app);
export const db = getFirestore(app, DB_ID);
export const functions = getFunctions(app, REGION);
export const storage = getStorage(app);

if (import.meta.env.VITE_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectFunctionsEmulator(functions, 'localhost', 5001);
  connectStorageEmulator(storage, 'localhost', 9199);
}

/**
 * Retire récursivement les clés `undefined` d'un payload. Le sérialiseur des fonctions
 * callable Firebase convertit `undefined` en `null` sur le fil ; or les schémas zod
 * `.optional()` rejettent `null` (→ « Requête invalide »). On omet donc les clés
 * absentes plutôt que de les envoyer à null.
 */
function pruneUndefined(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(pruneUndefined);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) out[k] = pruneUndefined(v);
    }
    return out;
  }
  return value;
}

/**
 * Fabrique une fonction callable dont le payload est nettoyé de ses `undefined`.
 * À utiliser partout à la place de `httpsCallable(functions, name)`.
 */
export function callable<Req = unknown, Res = unknown>(name: string): HttpsCallable<Req, Res> {
  const fn = httpsCallable<Req, Res>(functions, name);
  return ((data?: Req) => fn(pruneUndefined(data) as Req)) as HttpsCallable<Req, Res>;
}
