import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import { fft, db, reqOf, clearFirestore, count, ORG } from './setup';
import { upsertEmployee } from '../src/collaborateurs/upsertEmployee';

const create = fft.wrap(upsertEmployee);
const rh = { role: 'rh' };
const collab = { role: 'collaborateur', employeeId: 'e_x', departmentId: 'cyber' };

const dossier = (over: Partial<Record<string, unknown>> = {}) => ({
  firstName: 'Aïcha', lastName: 'Koné', email: 'a.kone@neurones.ci',
  departmentId: 'cyber', jobTitle: 'Consultante', seniorityLevel: 'confirme',
  contractType: 'cdi', hireDate: '2026-02-01', ...over,
});

beforeAll(async () => { await clearFirestore(); });
afterAll(() => fft.cleanup());
beforeEach(async () => {
  await clearFirestore();
  await db.doc('departments/cyber').set({ orgId: ORG, name: 'Cybersécurité' });
});

describe('upsertEmployee', () => {
  it('la RH crée un dossier dans un département existant + audit', async () => {
    const res: any = await create(reqOf(dossier(), rh, 'u_rh'));
    const doc = await db.doc(`employees/${res.id}`).get();
    expect(doc.get('lastName')).toBe('Koné');
    expect(await count('auditLogs')).toBeGreaterThan(0);
  });

  it('refuse la création dans un département inexistant', async () => {
    await expect(create(reqOf(dossier({ departmentId: 'inexistant' }), rh, 'u_rh')))
      .rejects.toThrow();
  });

  it('refuse la création par un collaborateur (droits insuffisants)', async () => {
    await expect(create(reqOf(dossier(), collab, 'u_collab'))).rejects.toThrow();
  });

  it('refuse un email invalide (validation zod serveur)', async () => {
    await expect(create(reqOf(dossier({ email: 'pas-un-email' }), rh, 'u_rh')))
      .rejects.toThrow();
  });

  it('refuse la mise à jour d’un dossier d’une AUTRE organisation', async () => {
    await db.doc('employees/e_foreign').set({
      orgId: 'autre-org', departmentId: 'cyber', lastName: 'Autre',
    });
    await expect(create(reqOf({ id: 'e_foreign', jobTitle: 'Pirate' }, rh, 'u_rh')))
      .rejects.toThrow();
  });
});
