import { beforeAll, afterAll, beforeEach, describe, it } from 'vitest';
import { assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { setupEnv, getEnv, as, seed, ORG } from './helpers';

beforeAll(async () => { await setupEnv(); });
afterAll(async () => { await getEnv().cleanup(); });
beforeEach(async () => { await getEnv().clearFirestore(); });

const rh        = () => as('u_rh',  { role: 'rh' });
const recruteur = () => as('u_rec', { role: 'recruteur' });
const collab    = () => as('u_at',  { role: 'collaborateur', departmentId: 'infra', employeeId: 'e_at' });

describe('ingestionJobs — RH/recruteur, écriture serveur', () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'ingestionJobs/j1'), { orgId: ORG, type: 'candidates', status: 'processing', total: 3, processed: 1, skipped: 0, errors: [] });
    });
  });
  it('la RH suit un job', async () => { await assertSucceeds(getDoc(doc(rh(), 'ingestionJobs/j1'))); });
  it('le recruteur suit un job', async () => { await assertSucceeds(getDoc(doc(recruteur(), 'ingestionJobs/j1'))); });
  it('un collaborateur ne suit pas les jobs', async () => { await assertFails(getDoc(doc(collab(), 'ingestionJobs/j1'))); });
  it('aucune écriture client (serveur uniquement)', async () => {
    await assertFails(setDoc(doc(rh(), 'ingestionJobs/j2'), { orgId: ORG, type: 'documents', status: 'pending', total: 0, processed: 0, skipped: 0, errors: [] }));
  });
});
