import { beforeAll, afterAll, beforeEach, describe, it } from 'vitest';
import { assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { setupEnv, getEnv, as, seed, ORG } from './helpers';

beforeAll(async () => { await setupEnv(); });
afterAll(async () => { await getEnv().cleanup(); });
beforeEach(async () => { await getEnv().clearFirestore(); });

const drh      = () => as('u_drh',    { role: 'drh' });
const rh       = () => as('u_rh',     { role: 'rh' });
const mgrCyber = () => as('u_mgr',    { role: 'manager', departmentId: 'cyber', employeeId: 'e_mgr' });
const collab   = () => as('u_collab', { role: 'collaborateur', departmentId: 'cyber', employeeId: 'e_collab' });

describe('departments — lecture org, écriture DRH', () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'departments/cyber'), { orgId: ORG, name: 'Cybersécurité' });
    });
  });
  it('un membre de l’organisation lit un département', async () => {
    await assertSucceeds(getDoc(doc(collab(), 'departments/cyber')));
  });
  it('la RH ne crée pas un département par écriture directe (réservé DRH)', async () => {
    await assertFails(setDoc(doc(rh(), 'departments/reseau'), { orgId: ORG, name: 'Réseau' }));
  });
  it('la DRH crée un département', async () => {
    await assertSucceeds(setDoc(doc(drh(), 'departments/reseau'), { orgId: ORG, name: 'Réseau' }));
  });
});

describe('employees — annuaire selon portée', () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'employees/e_cyber'), { orgId: ORG, departmentId: 'cyber', lastName: 'K' });
      await setDoc(doc(db, 'employees/e_reseau'), { orgId: ORG, departmentId: 'reseau', lastName: 'T' });
    });
  });
  it('RH lit un dossier de n’importe quel département', async () => {
    await assertSucceeds(getDoc(doc(rh(), 'employees/e_reseau')));
  });
  it('manager cyber lit un dossier de son département', async () => {
    await assertSucceeds(getDoc(doc(mgrCyber(), 'employees/e_cyber')));
  });
  it('manager cyber ne lit pas un dossier d’un autre département', async () => {
    await assertFails(getDoc(doc(mgrCyber(), 'employees/e_reseau')));
  });
});
