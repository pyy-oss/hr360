import { beforeAll, afterAll, beforeEach, describe, it } from 'vitest';
import { assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { setupEnv, getEnv, as, seed, ORG } from './helpers';

beforeAll(async () => { await setupEnv(); });
afterAll(async () => { await getEnv().cleanup(); });
beforeEach(async () => { await getEnv().clearFirestore(); });

const me     = () => as('u_me',    { role: 'collaborateur', employeeId: 'e_me' });
const other  = () => as('u_other', { role: 'collaborateur', employeeId: 'e_other' });

describe('notifications — destinataire uniquement', () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'notifications/n1'), { orgId: ORG, toUid: 'u_me', type: 'leave_decision', payload: { status: 'approuve' }, read: false });
    });
  });
  it('le destinataire lit sa notification', async () => {
    await assertSucceeds(getDoc(doc(me(), 'notifications/n1')));
  });
  it('un autre utilisateur ne lit pas la notification', async () => {
    await assertFails(getDoc(doc(other(), 'notifications/n1')));
  });
  it('le destinataire peut la marquer comme lue', async () => {
    await assertSucceeds(updateDoc(doc(me(), 'notifications/n1'), { read: true, readAt: 1 }));
  });
  it('le destinataire ne peut PAS altérer le contenu (autre champ que read/readAt)', async () => {
    await assertFails(updateDoc(doc(me(), 'notifications/n1'), { type: 'faux' }));
  });
  it('aucune création côté client (serveur uniquement)', async () => {
    await assertFails(setDoc(doc(me(), 'notifications/n2'), { orgId: ORG, toUid: 'u_me', type: 'x', read: false }));
  });
});
