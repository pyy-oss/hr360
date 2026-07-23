import { beforeAll, afterAll, beforeEach, describe, it } from 'vitest';
import { assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { setupEnv, getEnv, as, seed, ORG } from './helpers';

beforeAll(async () => { await setupEnv(); });
afterAll(async () => { await getEnv().cleanup(); });
beforeEach(async () => { await getEnv().clearFirestore(); });

const drh       = () => as('u_drh', { role: 'drh' });
const dirigeant = () => as('u_ceo', { role: 'dirigeant' });
const collab    = () => as('u_at',  { role: 'collaborateur', departmentId: 'infra', employeeId: 'e_at' });

describe('metricSnapshots — lecture pilotage/direction, écriture serveur', () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, `metricSnapshots/${ORG}_2026-07-01`), { orgId: ORG, day: '2026-07-01', headcount: 24 });
    });
  });
  it('la DRH lit les instantanés', async () => {
    await assertSucceeds(getDoc(doc(drh(), `metricSnapshots/${ORG}_2026-07-01`)));
  });
  it('le dirigeant lit les instantanés (tendances)', async () => {
    await assertSucceeds(getDoc(doc(dirigeant(), `metricSnapshots/${ORG}_2026-07-01`)));
  });
  it('un collaborateur ne lit pas les instantanés', async () => {
    await assertFails(getDoc(doc(collab(), `metricSnapshots/${ORG}_2026-07-01`)));
  });
  it('aucune écriture client (même DRH) — serveur uniquement', async () => {
    await assertFails(setDoc(doc(drh(), `metricSnapshots/${ORG}_2026-08-01`), { orgId: ORG, day: '2026-08-01', headcount: 25 }));
  });
});
