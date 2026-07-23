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

describe('onboardings — lecture RH/manager, écriture serveur', () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'onboardings/onb_e_at'), {
        orgId: ORG, employeeId: 'e_at', departmentId: 'infra',
        startDate: '2026-08-01', status: 'en_cours', tasks: [],
      });
    });
  });
  it('la RH lit une intégration', async () => {
    await assertSucceeds(getDoc(doc(rh(), 'onboardings/onb_e_at')));
  });
  it('le manager du département concerné lit l’intégration', async () => {
    await assertSucceeds(getDoc(doc(mgrInfra(), 'onboardings/onb_e_at')));
  });
  it('un manager d’un autre département ne lit pas l’intégration', async () => {
    await assertFails(getDoc(doc(mgrCyber(), 'onboardings/onb_e_at')));
  });
  it('le collaborateur concerné ne lit pas sa checklist interne', async () => {
    await assertFails(getDoc(doc(collab(), 'onboardings/onb_e_at')));
  });
  it('aucune écriture client (même RH) sur une intégration', async () => {
    await assertFails(setDoc(doc(rh(), 'onboardings/onb_new'), {
      orgId: ORG, employeeId: 'e_zz', departmentId: 'infra', startDate: '2026-10-01', status: 'en_cours', tasks: [],
    }));
  });
});
