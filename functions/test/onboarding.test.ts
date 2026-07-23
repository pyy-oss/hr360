import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import { fft, db, reqOf, clearFirestore, ORG } from './setup';
import { startOnboarding } from '../src/onboarding/startOnboarding';
import { updateOnboardingTask } from '../src/onboarding/updateOnboardingTask';
import { closeOnboarding } from '../src/onboarding/closeOnboarding';
import { decideProbation } from '../src/onboarding/decideProbation';

const start = fft.wrap(startOnboarding);
const updateTask = fft.wrap(updateOnboardingTask);
const close = fft.wrap(closeOnboarding);
const decide = fft.wrap(decideProbation);

const drh = { role: 'drh' };
const rh = { role: 'rh' };
const mgrInfra = { role: 'manager', departmentId: 'infra', employeeId: 'e_mgr' };
const mgrCyber = { role: 'manager', departmentId: 'cyber', employeeId: 'e_mgr2' };
const collab = { role: 'collaborateur', departmentId: 'infra', employeeId: 'e_at' };

const startBase = (over: Record<string, unknown> = {}) => ({
  employeeId: 'e_at', departmentId: 'infra', startDate: '2026-08-01', ...over,
});

beforeAll(async () => { await clearFirestore(); });
afterAll(() => fft.cleanup());
beforeEach(async () => {
  await clearFirestore();
  await db.doc('employees/e_at').set({ orgId: ORG, firstName: 'A', lastName: 'T', departmentId: 'infra', status: 'essai' });
});

describe('startOnboarding', () => {
  it('la RH démarre une intégration avec la checklist par défaut', async () => {
    const res: any = await start(reqOf(startBase(), rh, 'u_rh'));
    expect(res.id).toBe('onb_e_at');
    const doc = await db.doc('onboardings/onb_e_at').get();
    expect(doc.get('status')).toBe('en_cours');
    expect((doc.get('tasks') as unknown[]).length).toBeGreaterThan(0);
  });
  it('refuse une seconde intégration en cours pour le même collaborateur', async () => {
    await start(reqOf(startBase(), rh, 'u_rh'));
    await expect(start(reqOf(startBase(), rh, 'u_rh'))).rejects.toThrow();
  });
  it('refuse pour un collaborateur inexistant', async () => {
    await expect(start(reqOf(startBase({ employeeId: 'inconnu' }), rh, 'u_rh'))).rejects.toThrow();
  });
  it('le collaborateur ne démarre pas d’intégration', async () => {
    await expect(start(reqOf(startBase(), collab, 'u_at'))).rejects.toThrow();
  });
});

describe('updateOnboardingTask & closeOnboarding', () => {
  beforeEach(async () => { await start(reqOf(startBase(), rh, 'u_rh')); });

  it('le manager du département coche une tâche', async () => {
    await updateTask(reqOf({ id: 'onb_e_at', taskKey: 'comptes_si', done: true }, mgrInfra, 'u_mgr'));
    const doc = await db.doc('onboardings/onb_e_at').get();
    const t = (doc.get('tasks') as { key: string; done: boolean }[]).find((x) => x.key === 'comptes_si');
    expect(t?.done).toBe(true);
  });
  it('un manager d’un autre département ne modifie pas la checklist', async () => {
    await expect(updateTask(reqOf({ id: 'onb_e_at', taskKey: 'badge', done: true }, mgrCyber, 'u_mgr2'))).rejects.toThrow();
  });
  it('refuse la clôture tant que toutes les tâches ne sont pas faites', async () => {
    await expect(close(reqOf({ id: 'onb_e_at' }, rh, 'u_rh'))).rejects.toThrow();
  });
  it('clôture quand tout est fait — l’employé reste en « essai »', async () => {
    const doc0 = await db.doc('onboardings/onb_e_at').get();
    for (const t of doc0.get('tasks') as { key: string }[]) {
      await updateTask(reqOf({ id: 'onb_e_at', taskKey: t.key, done: true }, rh, 'u_rh'));
    }
    await close(reqOf({ id: 'onb_e_at' }, drh, 'u_drh'));
    const onb = await db.doc('onboardings/onb_e_at').get();
    expect(onb.get('status')).toBe('termine');
    const emp = await db.doc('employees/e_at').get();
    expect(emp.get('status')).toBe('essai');
  });
});

describe('decideProbation', () => {
  it('confirme l’essai → statut « confirme »', async () => {
    await decide(reqOf({ employeeId: 'e_at', outcome: 'confirme' }, drh, 'u_drh'));
    const emp = await db.doc('employees/e_at').get();
    expect(emp.get('status')).toBe('confirme');
  });
  it('non confirmé → statut « sortant »', async () => {
    await decide(reqOf({ employeeId: 'e_at', outcome: 'non_confirme', note: 'objectifs non atteints' }, drh, 'u_drh'));
    const emp = await db.doc('employees/e_at').get();
    expect(emp.get('status')).toBe('sortant');
  });
  it('refuse si le collaborateur n’est pas en période d’essai', async () => {
    await db.doc('employees/e_at').set({ status: 'confirme' }, { merge: true });
    await expect(decide(reqOf({ employeeId: 'e_at', outcome: 'confirme' }, drh, 'u_drh'))).rejects.toThrow();
  });
  it('le collaborateur ne décide pas de sa propre confirmation', async () => {
    await expect(decide(reqOf({ employeeId: 'e_at', outcome: 'confirme' }, collab, 'u_at'))).rejects.toThrow();
  });
  it('écrit une entrée d’audit avec avant/après', async () => {
    await decide(reqOf({ employeeId: 'e_at', outcome: 'confirme' }, rh, 'u_rh'));
    const logs = await db.collection('auditLogs').where('action', '==', 'decide_probation').get();
    expect(logs.size).toBeGreaterThanOrEqual(1);
  });
});
