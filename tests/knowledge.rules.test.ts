import { beforeAll, afterAll, beforeEach, describe, it } from 'vitest';
import { assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { setupEnv, getEnv, as, seed, ORG } from './helpers';

beforeAll(async () => { await setupEnv(); });
afterAll(async () => { await getEnv().cleanup(); });
beforeEach(async () => { await getEnv().clearFirestore(); });

const rh     = () => as('u_rh',  { role: 'rh' });
const collab = () => as('u_ak',  { role: 'collaborateur', departmentId: 'cyber', employeeId: 'e_ak' });
const other  = () => as('u_x',   { role: 'drh', orgId: 'autre' });

describe('knowledgeDocs — lecture org, écriture serveur', () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'knowledgeDocs/k1'), { orgId: ORG, title: 'Congés', category: 'procedure', content: '...' });
    });
  });
  it('un collaborateur lit un document de référence', async () => {
    await assertSucceeds(getDoc(doc(collab(), 'knowledgeDocs/k1')));
  });
  it('une autre organisation ne lit pas le document', async () => {
    await assertFails(getDoc(doc(other(), 'knowledgeDocs/k1')));
  });
  it('aucune écriture client (même RH) — serveur uniquement', async () => {
    await assertFails(setDoc(doc(rh(), 'knowledgeDocs/k2'), { orgId: ORG, title: 'X', category: 'faq', content: '...' }));
  });
});
