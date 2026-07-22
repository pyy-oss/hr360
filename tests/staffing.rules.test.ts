import { beforeAll, afterAll, beforeEach, describe, it } from 'vitest';
import { assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { setupEnv, getEnv, as, seed, ORG } from './helpers';

beforeAll(async () => { await setupEnv(); });
afterAll(async () => { await getEnv().cleanup(); });
beforeEach(async () => { await getEnv().clearFirestore(); });

const drh      = () => as('u_drh',    { role: 'drh' });
const mgrCyber = () => as('u_mgr',    { role: 'manager', departmentId: 'cyber', employeeId: 'e_mgr' });
const mgrRes   = () => as('u_mgr2',   { role: 'manager', departmentId: 'reseau', employeeId: 'e_mgr2' });
const collab   = () => as('u_collab', { role: 'collaborateur', departmentId: 'cyber', employeeId: 'e_collab' });

describe('missions — portée département', () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'missions/m1'), { orgId: ORG, departmentId: 'cyber', name: 'Audit', client: 'Banque' });
    });
  });
  it('un membre de l’organisation lit une mission', async () => {
    await assertSucceeds(getDoc(doc(collab(), 'missions/m1')));
  });
  it('le manager cyber crée une mission de son département', async () => {
    await assertSucceeds(setDoc(doc(mgrCyber(), 'missions/m2'), { orgId: ORG, departmentId: 'cyber', name: 'X', client: 'Y' }));
  });
  it('le manager réseau ne crée pas une mission « cyber »', async () => {
    await assertFails(setDoc(doc(mgrRes(), 'missions/m3'), { orgId: ORG, departmentId: 'cyber', name: 'X', client: 'Y' }));
  });
});

describe('assignments — lecture self / département', () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'assignments/a1'), {
        orgId: ORG, departmentId: 'cyber', employeeId: 'e_collab', missionId: 'm1',
        allocationPct: 50, startDate: '2026-01-01', endDate: '2026-06-30', status: 'active',
      });
    });
  });
  it('le collaborateur lit sa propre affectation', async () => {
    await assertSucceeds(getDoc(doc(collab(), 'assignments/a1')));
  });
  it('le manager cyber lit une affectation de son département', async () => {
    await assertSucceeds(getDoc(doc(mgrCyber(), 'assignments/a1')));
  });
  it('le manager réseau ne lit pas une affectation « cyber »', async () => {
    await assertFails(getDoc(doc(mgrRes(), 'assignments/a1')));
  });
  it('DRH crée une affectation', async () => {
    await assertSucceeds(setDoc(doc(drh(), 'assignments/a2'), {
      orgId: ORG, departmentId: 'cyber', employeeId: 'e_collab', missionId: 'm1',
      allocationPct: 30, startDate: '2026-07-01', endDate: '2026-09-30', status: 'prevue',
    }));
  });
});
