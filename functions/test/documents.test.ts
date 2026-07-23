import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import { fft, db, reqOf, clearFirestore, ORG } from './setup';
import { registerEmployeeDocument } from '../src/documents/registerEmployeeDocument';

const register = fft.wrap(registerEmployeeDocument);
const rh = { role: 'rh' };
const collab = { role: 'collaborateur', departmentId: 'infra', employeeId: 'e_at' };

const base = (over: Record<string, unknown> = {}) => ({
  employeeId: 'e_at', category: 'bulletin', name: 'Bulletin juillet 2026',
  storagePath: `documents/${ORG}/e_at/1234_bulletin.pdf`, ...over,
});

beforeAll(async () => { await clearFirestore(); });
afterAll(() => fft.cleanup());
beforeEach(async () => {
  await clearFirestore();
  await db.doc('employees/e_at').set({ orgId: ORG, firstName: 'A', lastName: 'T', departmentId: 'infra', status: 'confirme' });
});

describe('registerEmployeeDocument', () => {
  it('la RH enregistre un document avec un chemin valide', async () => {
    const res: any = await register(reqOf(base(), rh, 'u_rh'));
    const doc = await db.doc(`employeeDocuments/${res.id}`).get();
    expect(doc.get('employeeId')).toBe('e_at');
    expect(doc.get('category')).toBe('bulletin');
  });
  it('refuse un chemin de stockage ne correspondant pas au couple org/employé', async () => {
    await expect(register(reqOf(base({ storagePath: `documents/${ORG}/AUTRE/x.pdf` }), rh, 'u_rh'))).rejects.toThrow();
  });
  it('refuse pour un collaborateur inexistant', async () => {
    await expect(register(reqOf(base({ employeeId: 'inconnu', storagePath: `documents/${ORG}/inconnu/x.pdf` }), rh, 'u_rh'))).rejects.toThrow();
  });
  it('un collaborateur ne peut pas enregistrer de document', async () => {
    await expect(register(reqOf(base(), collab, 'u_at'))).rejects.toThrow();
  });
});
