import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import { fft, db, reqOf, clearFirestore, ORG } from './setup';
import { aiAssistant } from '../src/ai/aiAssistant';
import { scoreCandidate } from '../src/ai/scoreCandidate';
import { generateContent } from '../src/ai/generateContent';
import { predictAttrition } from '../src/ai/predictAttrition';

const assistant = fft.wrap(aiAssistant);
const score = fft.wrap(scoreCandidate);
const generate = fft.wrap(generateContent);
const predict = fft.wrap(predictAttrition);

const rh = { role: 'rh' };
const collab = { role: 'collaborateur', departmentId: 'cyber', employeeId: 'e_ak' };

beforeAll(async () => { await clearFirestore(); });
afterAll(() => fft.cleanup());
beforeEach(async () => { await clearFirestore(); });

// On teste les GARDES (RBAC + validation) qui s'exécutent AVANT tout appel réseau à
// Claude — l'appel réel nécessite le secret + le réseau et n'est pas testé ici.
describe('aiAssistant — gardes', () => {
  it('refuse un appel non authentifié', async () => {
    await expect(assistant({ data: { message: 'Bonjour' }, auth: undefined } as any)).rejects.toThrow();
  });
  it('refuse un message vide (validation zod)', async () => {
    await expect(assistant(reqOf({ message: '' }, rh, 'u_rh'))).rejects.toThrow();
  });
  it('refuse un utilisateur sans rôle', async () => {
    await expect(assistant({ data: { message: 'Bonjour' }, auth: { uid: 'u_x', token: { orgId: ORG } } } as any)).rejects.toThrow();
  });
});

describe('scoreCandidate — gardes', () => {
  beforeEach(async () => {
    await db.doc('candidates/c1').set({ orgId: ORG, departmentId: 'cyber', firstName: 'S', lastName: 'G', email: 's@x.ci', source: 'site', stage: 'nouveau', yearsExperience: 5, tags: ['OSCP'] });
    await db.doc('positions/p1').set({ orgId: ORG, departmentId: 'cyber', title: 'Consultant', level: 'confirme', mustSkills: ['Pentest'], niceSkills: [], excludedCriteria: ['age'] });
  });
  it('refuse une requête invalide (avant tout accès)', async () => {
    await expect(score(reqOf({}, rh, 'u_rh'))).rejects.toThrow();
  });
  it('refuse un candidat/poste inexistant', async () => {
    await expect(score(reqOf({ candidateId: 'nope', positionId: 'p1' }, rh, 'u_rh'))).rejects.toThrow();
  });
  it('refuse un collaborateur (non recruteur)', async () => {
    await expect(score(reqOf({ candidateId: 'c1', positionId: 'p1' }, collab, 'u_ak'))).rejects.toThrow();
  });
});

describe('generateContent — gardes', () => {
  it('refuse un type inconnu (validation zod)', async () => {
    await expect(generate(reqOf({ kind: 'inconnu' }, rh, 'u_rh'))).rejects.toThrow();
  });
  it('refuse un utilisateur non habilité', async () => {
    await expect(generate(reqOf({ kind: 'offre' }, collab, 'u_ak'))).rejects.toThrow();
  });
  it('refuse un poste de référence inexistant', async () => {
    await expect(generate(reqOf({ kind: 'offre', positionId: 'nope' }, rh, 'u_rh'))).rejects.toThrow();
  });
});

describe('predictAttrition — gardes', () => {
  it('refuse un appel non authentifié', async () => {
    await expect(predict({ data: {}, auth: undefined } as any)).rejects.toThrow();
  });
  it('refuse la RH (réservé DRH/super_admin)', async () => {
    await expect(predict(reqOf({}, rh, 'u_rh'))).rejects.toThrow();
  });
  it('refuse un collaborateur', async () => {
    await expect(predict(reqOf({}, collab, 'u_ak'))).rejects.toThrow();
  });
});
