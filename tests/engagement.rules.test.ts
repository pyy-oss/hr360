import { beforeAll, afterAll, beforeEach, describe, it } from 'vitest';
import { assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { setupEnv, getEnv, as, seed, ORG } from './helpers';

beforeAll(async () => { await setupEnv(); });
afterAll(async () => { await getEnv().cleanup(); });
beforeEach(async () => { await getEnv().clearFirestore(); });

const rh     = () => as('u_rh',     { role: 'rh' });
const collab = () => as('u_ak',     { role: 'collaborateur', departmentId: 'cyber', employeeId: 'e_ak' });

describe('engagement — enquêtes lisibles, réponses/votes server-only', () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'engagementSurveys/s1'), { orgId: ORG, title: 'Pulse', status: 'ouverte', questions: [{ key: 'sens', label: 'Sens' }] });
      await setDoc(doc(db, 'engagementResponses/r1'), { orgId: ORG, surveyId: 's1', scores: { sens: 5 } });
      await setDoc(doc(db, 'engagementVotes/s1__u_ak'), { orgId: ORG, surveyId: 's1' });
    });
  });
  it('le collaborateur lit une enquête (pour y répondre)', async () => {
    await assertSucceeds(getDoc(doc(collab(), 'engagementSurveys/s1')));
  });
  it('personne ne crée d’enquête côté client (même RH)', async () => {
    await assertFails(setDoc(doc(rh(), 'engagementSurveys/s2'), { orgId: ORG, title: 'X', status: 'ouverte', questions: [] }));
  });
  it('aucune lecture client d’une réponse (anonymat) — même la RH', async () => {
    await assertFails(getDoc(doc(rh(), 'engagementResponses/r1')));
  });
  it('aucune écriture client d’une réponse', async () => {
    await assertFails(setDoc(doc(collab(), 'engagementResponses/r2'), { orgId: ORG, surveyId: 's1', scores: { sens: 3 } }));
  });
  it('aucune lecture ni écriture client d’un marqueur de vote', async () => {
    await assertFails(getDoc(doc(collab(), 'engagementVotes/s1__u_ak')));
    await assertFails(setDoc(doc(collab(), 'engagementVotes/s1__u_zz'), { orgId: ORG, surveyId: 's1' }));
  });
});
