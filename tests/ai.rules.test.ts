import { beforeAll, afterAll, beforeEach, describe, it } from 'vitest';
import { assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { setupEnv, getEnv, as, seed, ORG } from './helpers';

beforeAll(async () => { await setupEnv(); });
afterAll(async () => { await getEnv().cleanup(); });
beforeEach(async () => { await getEnv().clearFirestore(); });

const drh    = () => as('u_drh', { role: 'drh' });
const rh     = () => as('u_rh',  { role: 'rh' });
const collab = () => as('u_ak',  { role: 'collaborateur', departmentId: 'cyber', employeeId: 'e_ak' });

describe('aiInvocations — journal de gouvernance IA', () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'aiInvocations/i1'), { orgId: ORG, feature: 'assistant', model: 'claude-opus-4-8', actorRole: 'rh', ok: true, latencyMs: 1200 });
    });
  });
  it('la DRH lit le journal IA', async () => {
    await assertSucceeds(getDoc(doc(drh(), 'aiInvocations/i1')));
  });
  it('la RH ne lit PAS le journal IA (réservé gouvernance)', async () => {
    await assertFails(getDoc(doc(rh(), 'aiInvocations/i1')));
  });
  it('un collaborateur ne lit pas le journal IA', async () => {
    await assertFails(getDoc(doc(collab(), 'aiInvocations/i1')));
  });
  it('aucune écriture client dans le journal IA (serveur uniquement)', async () => {
    await assertFails(setDoc(doc(drh(), 'aiInvocations/i2'), { orgId: ORG, feature: 'assistant', model: 'x', ok: true }));
  });
});
