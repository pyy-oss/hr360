import { beforeAll, afterAll, beforeEach, describe, it } from 'vitest';
import { assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { setupEnv, getEnv, as, seed, ORG } from './helpers';

beforeAll(async () => { await setupEnv(); });
afterAll(async () => { await getEnv().cleanup(); });
beforeEach(async () => { await getEnv().clearFirestore(); });

const rh        = () => as('u_rh',   { role: 'rh' });
const recruteur = () => as('u_rec',  { role: 'recruteur' });
const mgrCyber  = () => as('u_m',    { role: 'manager', departmentId: 'cyber', employeeId: 'e_m' });
const mgrInfra  = () => as('u_m2',   { role: 'manager', departmentId: 'infra', employeeId: 'e_m2' });
const collab    = () => as('u_at',   { role: 'collaborateur', departmentId: 'cyber', employeeId: 'e_at' });

describe('interviews — recrutement & manager du département', () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'interviews/i1'), { orgId: ORG, candidateId: 'c1', departmentId: 'cyber', scheduledAt: '2026-08-01T10:00', mode: 'visio', status: 'planifie' });
    });
  });
  it('le recruteur lit un entretien', async () => { await assertSucceeds(getDoc(doc(recruteur(), 'interviews/i1'))); });
  it('le manager du département concerné lit', async () => { await assertSucceeds(getDoc(doc(mgrCyber(), 'interviews/i1'))); });
  it('un manager d’un autre département ne lit pas', async () => { await assertFails(getDoc(doc(mgrInfra(), 'interviews/i1'))); });
  it('un collaborateur ne lit pas', async () => { await assertFails(getDoc(doc(collab(), 'interviews/i1'))); });
  it('aucune écriture client (même RH) — serveur uniquement', async () => {
    await assertFails(setDoc(doc(rh(), 'interviews/i2'), { orgId: ORG, candidateId: 'c2', departmentId: 'cyber', scheduledAt: '2026-08-02T10:00', mode: 'tel', status: 'planifie' }));
  });
});
