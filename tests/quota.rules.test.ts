import { beforeAll, afterAll, beforeEach, describe, it } from 'vitest';
import { assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { setupEnv, getEnv, as, seed, ORG } from './helpers';

beforeAll(async () => { await setupEnv(); });
afterAll(async () => { await getEnv().cleanup(); });
beforeEach(async () => { await getEnv().clearFirestore(); });

const drh    = () => as('u_drh', { role: 'drh' });
const collab = () => as('u_ak',  { role: 'collaborateur', departmentId: 'cyber', employeeId: 'e_ak' });

describe('aiQuota — compteur serveur uniquement', () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'aiQuota/u_ak_2026-07-23'), { orgId: ORG, uid: 'u_ak', day: '2026-07-23', count: 5 });
    });
  });
  it('aucune lecture client du compteur (même son propre)', async () => {
    await assertFails(getDoc(doc(collab(), 'aiQuota/u_ak_2026-07-23')));
  });
  it('aucune lecture DRH (serveur uniquement)', async () => {
    await assertFails(getDoc(doc(drh(), 'aiQuota/u_ak_2026-07-23')));
  });
  it('aucune écriture client (pas de contournement du quota)', async () => {
    await assertFails(setDoc(doc(collab(), 'aiQuota/u_ak_2026-07-23'), { orgId: ORG, uid: 'u_ak', day: '2026-07-23', count: 0 }));
  });
});
