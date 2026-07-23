import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import { fft, db, reqOf, clearFirestore, ORG } from './setup';
import { startOffboarding } from '../src/offboarding/startOffboarding';
import { updateOffboardingTask } from '../src/offboarding/updateOffboardingTask';
import { closeOffboarding } from '../src/offboarding/closeOffboarding';

const start = fft.wrap(startOffboarding);
const updateTask = fft.wrap(updateOffboardingTask);
const close = fft.wrap(closeOffboarding);

const drh = { role: 'drh' };
const rh = { role: 'rh' };
const mgrInfra = { role: 'manager', departmentId: 'infra', employeeId: 'e_mgr' };
const mgrCyber = { role: 'manager', departmentId: 'cyber', employeeId: 'e_mgr2' };
const collab = { role: 'collaborateur', departmentId: 'infra', employeeId: 'e_at' };

const startBase = (over: Record<string, unknown> = {}) => ({
  employeeId: 'e_at', departmentId: 'infra', reason: 'demission', lastDay: '2026-09-30', ...over,
});

beforeAll(async () => { await clearFirestore(); });
afterAll(() => fft.cleanup());
beforeEach(async () => {
  await clearFirestore();
  await db.doc('employees/e_at').set({ orgId: ORG, firstName: 'A', lastName: 'T', departmentId: 'infra', status: 'confirme' });
});

describe('startOffboarding', () => {
  it('la RH démarre un offboarding avec la checklist par défaut', async () => {
    const res: any = await start(reqOf(startBase(), rh, 'u_rh'));
    expect(res.id).toBe('off_e_at');
    const doc = await db.doc('offboardings/off_e_at').get();
    expect(doc.get('status')).toBe('en_cours');
    expect((doc.get('tasks') as unknown[]).length).toBeGreaterThan(0);
  });
  it('refuse un second offboarding en cours pour le même collaborateur', async () => {
    await start(reqOf(startBase(), rh, 'u_rh'));
    await expect(start(reqOf(startBase(), rh, 'u_rh'))).rejects.toThrow();
  });
  it('refuse pour un collaborateur inexistant', async () => {
    await expect(start(reqOf(startBase({ employeeId: 'inconnu' }), rh, 'u_rh'))).rejects.toThrow();
  });
  it('le collaborateur ne démarre pas d’offboarding', async () => {
    await expect(start(reqOf(startBase(), collab, 'u_at'))).rejects.toThrow();
  });
});

describe('updateOffboardingTask & closeOffboarding', () => {
  beforeEach(async () => { await start(reqOf(startBase(), rh, 'u_rh')); });

  it('le manager du département coche une tâche', async () => {
    await updateTask(reqOf({ id: 'off_e_at', taskKey: 'restitution_materiel', done: true }, mgrInfra, 'u_mgr'));
    const doc = await db.doc('offboardings/off_e_at').get();
    const t = (doc.get('tasks') as { key: string; done: boolean }[]).find((x) => x.key === 'restitution_materiel');
    expect(t?.done).toBe(true);
  });
  it('un manager d’un autre département ne modifie pas la checklist', async () => {
    await expect(updateTask(reqOf({ id: 'off_e_at', taskKey: 'badge', done: true }, mgrCyber, 'u_mgr2'))).rejects.toThrow();
  });
  it('refuse la clôture tant que toutes les tâches ne sont pas faites', async () => {
    await expect(close(reqOf({ id: 'off_e_at' }, rh, 'u_rh'))).rejects.toThrow();
  });
  it('clôture quand tout est fait et bascule l’employé en « sortant »', async () => {
    const doc0 = await db.doc('offboardings/off_e_at').get();
    for (const t of doc0.get('tasks') as { key: string }[]) {
      await updateTask(reqOf({ id: 'off_e_at', taskKey: t.key, done: true }, rh, 'u_rh'));
    }
    await close(reqOf({ id: 'off_e_at' }, drh, 'u_drh'));
    const off = await db.doc('offboardings/off_e_at').get();
    expect(off.get('status')).toBe('cloture');
    const emp = await db.doc('employees/e_at').get();
    expect(emp.get('status')).toBe('sortant');
  });
});
