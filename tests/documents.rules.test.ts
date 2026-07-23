import { beforeAll, afterAll, beforeEach, describe, it } from 'vitest';
import { assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { setupEnv, getEnv, as, seed, ORG } from './helpers';

beforeAll(async () => { await setupEnv(); });
afterAll(async () => { await getEnv().cleanup(); });
beforeEach(async () => { await getEnv().clearFirestore(); });

const rh    = () => as('u_rh', { role: 'rh' });
const owner = () => as('u_at', { role: 'collaborateur', departmentId: 'infra', employeeId: 'e_at' });
const other = () => as('u_x',  { role: 'collaborateur', departmentId: 'infra', employeeId: 'e_other' });

describe('employeeDocuments — RH ou propriétaire', () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'employeeDocuments/d1'), { orgId: ORG, employeeId: 'e_at', category: 'bulletin', name: 'Bulletin', storagePath: `documents/${ORG}/e_at/x.pdf` });
    });
  });
  it('la RH lit le document', async () => { await assertSucceeds(getDoc(doc(rh(), 'employeeDocuments/d1'))); });
  it('le propriétaire lit son document', async () => { await assertSucceeds(getDoc(doc(owner(), 'employeeDocuments/d1'))); });
  it('un autre collaborateur ne lit pas', async () => { await assertFails(getDoc(doc(other(), 'employeeDocuments/d1'))); });
  it('aucune écriture client (même RH) — serveur uniquement', async () => {
    await assertFails(setDoc(doc(rh(), 'employeeDocuments/d2'), { orgId: ORG, employeeId: 'e_at', category: 'contrat', name: 'X', storagePath: `documents/${ORG}/e_at/y.pdf` }));
  });
});
