import { beforeAll, afterAll, beforeEach, describe, it } from 'vitest';
import { assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { setupEnv, getEnv, as, seed, ORG } from './helpers';

beforeAll(async () => { await setupEnv(); });
afterAll(async () => { await getEnv().cleanup(); });
beforeEach(async () => { await getEnv().clearFirestore(); });

const rh       = () => as('u_rh',     { role: 'rh' });
const mgrInfra = () => as('u_mgr',    { role: 'manager', departmentId: 'infra', employeeId: 'e_mgr' });
const mgrCyber = () => as('u_mgr2',   { role: 'manager', departmentId: 'cyber', employeeId: 'e_mgr2' });
const collab   = () => as('u_at',     { role: 'collaborateur', departmentId: 'infra', employeeId: 'e_at' });

describe('offboardings — lecture RH/manager, écriture serveur', () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'offboardings/off_e_at'), {
        orgId: ORG, employeeId: 'e_at', departmentId: 'infra', reason: 'demission',
        lastDay: '2026-09-30', status: 'en_cours', tasks: [],
      });
    });
  });
  it('la RH lit un offboarding', async () => {
    await assertSucceeds(getDoc(doc(rh(), 'offboardings/off_e_at')));
  });
  it('le manager du département concerné lit l’offboarding', async () => {
    await assertSucceeds(getDoc(doc(mgrInfra(), 'offboardings/off_e_at')));
  });
  it('un manager d’un autre département ne lit pas l’offboarding', async () => {
    await assertFails(getDoc(doc(mgrCyber(), 'offboardings/off_e_at')));
  });
  it('le collaborateur concerné ne lit pas sa checklist interne', async () => {
    await assertFails(getDoc(doc(collab(), 'offboardings/off_e_at')));
  });
  it('aucune écriture client (même RH) sur un offboarding', async () => {
    await assertFails(setDoc(doc(rh(), 'offboardings/off_new'), {
      orgId: ORG, employeeId: 'e_zz', departmentId: 'infra', reason: 'demission', lastDay: '2026-10-01', status: 'en_cours', tasks: [],
    }));
  });
});
