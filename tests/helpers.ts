import { readFileSync } from 'fs';
import {
  initializeTestEnvironment, RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import type { Firestore } from 'firebase/firestore';

export const ORG = 'neurones';
let env: RulesTestEnvironment;

// projectId unique par fichier de test : les fichiers Vitest s'exécutent en
// parallèle contre le même émulateur ; un projectId partagé ferait que le
// clearFirestore() d'un fichier efface les fixtures d'un autre (données ->
// resource.data null -> « Null value error » dans les règles).
const PROJECT_ID = `neurones-hr-360-test-${Math.random().toString(36).slice(2, 10)}`;

export async function setupEnv(): Promise<RulesTestEnvironment> {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
  return env;
}
export const getEnv = () => env;

type Claims = {
  role: string; orgId?: string; employeeId?: string; departmentId?: string; departmentIds?: string[];
};

/** Firestore authentifié avec des custom claims (rôle + rattachement). */
export function as(uid: string, claims: Claims): Firestore {
  return env.authenticatedContext(uid, { orgId: ORG, ...claims }).firestore() as unknown as Firestore;
}

/** Firestore non authentifié. */
export function anon(): Firestore {
  return env.unauthenticatedContext().firestore() as unknown as Firestore;
}

/** Seed sans passer par les règles (préparation des fixtures). */
export async function seed(fn: (db: Firestore) => Promise<void>) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await fn(ctx.firestore() as unknown as Firestore);
  });
}
