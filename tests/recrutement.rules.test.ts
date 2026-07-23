import { beforeAll, afterAll, beforeEach, describe, it } from 'vitest';
import { assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { setupEnv, getEnv, as, seed, ORG } from './helpers';

beforeAll(async () => { await setupEnv(); });
afterAll(async () => { await getEnv().cleanup(); });
beforeEach(async () => { await getEnv().clearFirestore(); });

const drh      = () => as('u_drh',    { role: 'drh' });
const rh       = () => as('u_rh',     { role: 'rh' });
const lecture  = () => as('u_lec',    { role: 'lecture' });
const mgrCyber = () => as('u_mgr',    { role: 'manager', departmentId: 'cyber', employeeId: 'e_mgr' });
const mgrRes   = () => as('u_mgr2',   { role: 'manager', departmentId: 'reseau', employeeId: 'e_mgr2' });
const collab   = () => as('u_collab', { role: 'collaborateur', departmentId: 'cyber', employeeId: 'e_collab' });
const otherOrg = () => as('u_x',      { role: 'drh', orgId: 'autre' });

describe('positions — ouvertures de poste', () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'positions/p1'), { orgId: ORG, departmentId: 'cyber', title: 'Consultant', level: 'confirme', status: 'ouvert' });
    });
  });
  it('un membre de l’organisation lit un poste', async () => {
    await assertSucceeds(getDoc(doc(collab(), 'positions/p1')));
  });
  it('une autre organisation ne lit pas le poste', async () => {
    await assertFails(getDoc(doc(otherOrg(), 'positions/p1')));
  });
  it('RH crée un poste', async () => {
    await assertSucceeds(setDoc(doc(rh(), 'positions/p2'), { orgId: ORG, departmentId: 'cyber', title: 'X', level: 'junior', status: 'ouvert' }));
  });
  it('le manager cyber crée un poste de son département', async () => {
    await assertSucceeds(setDoc(doc(mgrCyber(), 'positions/p3'), { orgId: ORG, departmentId: 'cyber', title: 'X', level: 'junior', status: 'ouvert' }));
  });
  it('le manager réseau ne crée pas un poste « cyber »', async () => {
    await assertFails(setDoc(doc(mgrRes(), 'positions/p4'), { orgId: ORG, departmentId: 'cyber', title: 'X', level: 'junior', status: 'ouvert' }));
  });
  it('le collaborateur ne crée pas de poste', async () => {
    await assertFails(setDoc(doc(collab(), 'positions/p5'), { orgId: ORG, departmentId: 'cyber', title: 'X', level: 'junior', status: 'ouvert' }));
  });
});

describe('candidates — données personnelles (accès recruteur)', () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'candidates/c1'), { orgId: ORG, departmentId: 'cyber', firstName: 'Salif', lastName: 'G', email: 's@x.ci', source: 'site', stage: 'nouveau', yearsExperience: 5 });
    });
  });
  it('RH lit un candidat', async () => {
    await assertSucceeds(getDoc(doc(rh(), 'candidates/c1')));
  });
  it('le manager cyber lit un candidat de son département', async () => {
    await assertSucceeds(getDoc(doc(mgrCyber(), 'candidates/c1')));
  });
  it('le manager réseau ne lit pas un candidat « cyber »', async () => {
    await assertFails(getDoc(doc(mgrRes(), 'candidates/c1')));
  });
  it('« lecture » ne lit PAS un candidat (minimisation ARTCI)', async () => {
    await assertFails(getDoc(doc(lecture(), 'candidates/c1')));
  });
  it('un collaborateur ne lit pas un candidat', async () => {
    await assertFails(getDoc(doc(collab(), 'candidates/c1')));
  });
  it('une autre organisation ne lit pas le candidat', async () => {
    await assertFails(getDoc(doc(otherOrg(), 'candidates/c1')));
  });
  it('RH crée un candidat', async () => {
    await assertSucceeds(setDoc(doc(rh(), 'candidates/c2'), { orgId: ORG, departmentId: 'cyber', firstName: 'N', lastName: 'B', email: 'n@x.ci', source: 'spontanee', stage: 'nouveau', yearsExperience: 3 }));
  });
  it('le collaborateur ne crée pas de candidat', async () => {
    await assertFails(setDoc(doc(collab(), 'candidates/c3'), { orgId: ORG, departmentId: 'cyber', firstName: 'N', lastName: 'B', email: 'n@x.ci', source: 'spontanee', stage: 'nouveau', yearsExperience: 3 }));
  });
  it('RH ne délète pas un candidat', async () => {
    await assertFails(deleteDoc(doc(rh(), 'candidates/c1')));
  });
  it('DRH délète un candidat', async () => {
    await assertSucceeds(deleteDoc(doc(drh(), 'candidates/c1')));
  });
});
