import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import { getAuth } from 'firebase-admin/auth';
import { fft, db, reqOf, clearFirestore, ORG } from './setup';
import { setUserRole } from '../src/auth/setUserRole';

const setRole = fft.wrap(setUserRole);
const auth = getAuth();
const drh = { role: 'drh' };
const superAdmin = { role: 'super_admin' };

/** Crée (ou réinitialise) un compte Auth de test avec des claims optionnels. */
async function makeUser(uid: string, claims?: Record<string, unknown>) {
  await auth.deleteUser(uid).catch(() => undefined);
  await auth.createUser({ uid });
  if (claims) await auth.setCustomUserClaims(uid, claims);
}

beforeAll(async () => { await clearFirestore(); });
afterAll(() => fft.cleanup());
beforeEach(async () => {
  await clearFirestore();
  await db.doc('departments/cyber').set({ orgId: ORG, name: 'Cybersécurité' });
});

describe('setUserRole — anti-escalade & anti-capture cross-org', () => {
  it('la DRH attribue un rôle dans son organisation (nominal)', async () => {
    await makeUser('u_target');
    const res: any = await setRole(reqOf({ uid: 'u_target', role: 'rh' }, drh, 'u_drh'));
    expect(res.ok).toBe(true);
    const u = await auth.getUser('u_target');
    expect((u.customClaims as any).role).toBe('rh');
    expect((u.customClaims as any).orgId).toBe(ORG);
  });

  it('la DRH ne peut PAS attribuer le rôle super_admin (anti-escalade)', async () => {
    await makeUser('u_esc');
    await expect(setRole(reqOf({ uid: 'u_esc', role: 'super_admin' }, drh, 'u_drh')))
      .rejects.toThrow();
  });

  it('le super_admin peut attribuer super_admin', async () => {
    await makeUser('u_sa_target');
    const res: any = await setRole(reqOf({ uid: 'u_sa_target', role: 'super_admin' }, superAdmin, 'u_sa'));
    expect(res.ok).toBe(true);
  });

  it('refuse la capture d’un compte appartenant à une AUTRE organisation', async () => {
    await makeUser('u_other', { role: 'collaborateur', orgId: 'autre-org' });
    await expect(setRole(reqOf({ uid: 'u_other', role: 'rh' }, drh, 'u_drh')))
      .rejects.toThrow();
  });

  it('refuse un rattachement à un département hors organisation', async () => {
    await makeUser('u_dep');
    await expect(setRole(reqOf(
      { uid: 'u_dep', role: 'manager', departmentId: 'inexistant' }, drh, 'u_drh',
    ))).rejects.toThrow();
  });
});
