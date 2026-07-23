import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});

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
