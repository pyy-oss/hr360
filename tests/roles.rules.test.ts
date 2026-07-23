import { beforeAll, afterAll, beforeEach, describe, it } from 'vitest';
import { assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { setupEnv, getEnv, as, seed, ORG } from './helpers';

beforeAll(async () => { await setupEnv(); });
afterAll(async () => { await getEnv().cleanup(); });
beforeEach(async () => { await getEnv().clearFirestore(); });

const dirigeant = () => as('u_ceo', { role: 'dirigeant' });
const recruteur = () => as('u_rec', { role: 'recruteur' });
const collab    = () => as('u_at',  { role: 'collaborateur', departmentId: 'infra', employeeId: 'e_at' });
// Manager avec un PORTEFEUILLE multi-départements (Codir transverse / HRBP).
const mgrMulti  = () => as('u_dir', { role: 'manager', departmentId: 'infra', departmentIds: ['infra', 'cyber'] });

describe('dirigeant — lecture stratégique (agrégats), sans PII sensible', () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'employees/e_at'), { orgId: ORG, firstName: 'A', lastName: 'T', departmentId: 'infra', status: 'confirme' });
      await setDoc(doc(db, 'auditLogs/l1'), { orgId: ORG, action: 'set_role', actorUid: 'x', at: 1 });
      await setDoc(doc(db, 'aiInvocations/i1'), { orgId: ORG, feature: 'assistant', ok: true });
      await setDoc(doc(db, 'candidates/c1'), { orgId: ORG, firstName: 'X', lastName: 'Y', departmentId: 'cyber', stage: 'nouveau' });
      await setDoc(doc(db, 'compensations/e_at'), { orgId: ORG, employeeId: 'e_at', baseSalary: 9000000 });
    });
  });
  it('lit l’annuaire (effectifs)', async () => { await assertSucceeds(getDoc(doc(dirigeant(), 'employees/e_at'))); });
  it('lit le journal d’audit', async () => { await assertSucceeds(getDoc(doc(dirigeant(), 'auditLogs/l1'))); });
  it('lit l’usage IA (gouvernance)', async () => { await assertSucceeds(getDoc(doc(dirigeant(), 'aiInvocations/i1'))); });
  it('ne lit PAS les candidats (donnée sensible)', async () => { await assertFails(getDoc(doc(dirigeant(), 'candidates/c1'))); });
  it('ne lit PAS une rémunération individuelle', async () => { await assertFails(getDoc(doc(dirigeant(), 'compensations/e_at'))); });
});

describe('recruteur — périmètre recrutement', () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'candidates/c1'), { orgId: ORG, firstName: 'X', lastName: 'Y', departmentId: 'cyber', stage: 'nouveau' });
      await setDoc(doc(db, 'compensations/e_at'), { orgId: ORG, employeeId: 'e_at', baseSalary: 9000000 });
    });
  });
  it('lit les candidats', async () => { await assertSucceeds(getDoc(doc(recruteur(), 'candidates/c1'))); });
  it('ne lit PAS les rémunérations', async () => { await assertFails(getDoc(doc(recruteur(), 'compensations/e_at'))); });
  it('un collaborateur ne lit pas les candidats', async () => { await assertFails(getDoc(doc(collab(), 'candidates/c1'))); });
});

describe('manager multi-départements — périmètre élargi (departmentIds)', () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'employees/e_cyber'), { orgId: ORG, firstName: 'C', lastName: 'Y', departmentId: 'cyber', status: 'confirme' });
      await setDoc(doc(db, 'employees/e_conseil'), { orgId: ORG, firstName: 'H', lastName: 'B', departmentId: 'conseil', status: 'confirme' });
    });
  });
  it('lit un collaborateur d’un département de son portefeuille (cyber)', async () => {
    await assertSucceeds(getDoc(doc(mgrMulti(), 'employees/e_cyber')));
  });
  it('ne lit pas un collaborateur hors de son portefeuille (conseil)', async () => {
    await assertFails(getDoc(doc(mgrMulti(), 'employees/e_conseil')));
  });
});
