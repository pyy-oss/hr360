import { beforeAll, afterAll, beforeEach, describe, it } from 'vitest';
import { assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { collection, query, where, limit, getDocs, setDoc, doc } from 'firebase/firestore';
import { setupEnv, getEnv, as, seed, ORG } from './helpers';

beforeAll(async () => { await setupEnv(); });
afterAll(async () => { await getEnv().cleanup(); });
beforeEach(async () => { await getEnv().clearFirestore(); });

const drh = () => as('u_drh', { role: 'drh' });

// Régression : les règles org-scoped (sameOrg) imposent que toute requête LISTE soit
// filtrée par orgId. Sans ce filtre, dès qu'un document d'une autre organisation existe
// dans le projet partagé, la requête entière est refusée (« insufficient permissions »).
describe('requêtes liste — le filtre orgId est obligatoire', () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'employees/e1'), { orgId: ORG, firstName: 'A', lastName: 'T', departmentId: 'infra', status: 'confirme' });
      await setDoc(doc(db, 'employees/e2'), { orgId: 'autre-org', firstName: 'B', lastName: 'U', departmentId: 'x', status: 'confirme' });
    });
  });
  it('la liste NON filtrée par orgId est refusée (données inter-org)', async () => {
    await assertFails(getDocs(query(collection(drh(), 'employees'), limit(50))));
  });
  it('la liste filtrée par orgId est autorisée', async () => {
    await assertSucceeds(getDocs(query(collection(drh(), 'employees'), where('orgId', '==', ORG), limit(50))));
  });
});
