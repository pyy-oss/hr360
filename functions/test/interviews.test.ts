import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import { fft, db, reqOf, clearFirestore, ORG } from './setup';
import { scheduleInterview } from '../src/recrutement/scheduleInterview';
import { updateInterview } from '../src/recrutement/updateInterview';

const schedule = fft.wrap(scheduleInterview);
const update = fft.wrap(updateInterview);

const rh = { role: 'rh' };
const recruteur = { role: 'recruteur' };
const mgrCyber = { role: 'manager', departmentId: 'cyber', employeeId: 'e_m' };
const mgrInfra = { role: 'manager', departmentId: 'infra', employeeId: 'e_m2' };
const collab = { role: 'collaborateur', departmentId: 'cyber', employeeId: 'e_at' };

const base = (over: Record<string, unknown> = {}) => ({
  candidateId: 'c1', scheduledAt: '2026-08-01T10:00', mode: 'visio', ...over,
});

beforeAll(async () => { await clearFirestore(); });
afterAll(() => fft.cleanup());
beforeEach(async () => {
  await clearFirestore();
  await db.doc('candidates/c1').set({ orgId: ORG, firstName: 'X', lastName: 'Y', departmentId: 'cyber', stage: 'entretien' });
});

describe('scheduleInterview', () => {
  it('le recruteur planifie un entretien (dénormalise le département)', async () => {
    const res: any = await schedule(reqOf(base(), recruteur, 'u_rec'));
    const doc = await db.doc(`interviews/${res.id}`).get();
    expect(doc.get('status')).toBe('planifie');
    expect(doc.get('departmentId')).toBe('cyber');
  });
  it('le manager du département du candidat planifie', async () => {
    const res: any = await schedule(reqOf(base(), mgrCyber, 'u_m'));
    expect(res.ok).toBe(true);
  });
  it('un manager d’un autre département ne planifie pas', async () => {
    await expect(schedule(reqOf(base(), mgrInfra, 'u_m2'))).rejects.toThrow();
  });
  it('un collaborateur ne planifie pas', async () => {
    await expect(schedule(reqOf(base(), collab, 'u_at'))).rejects.toThrow();
  });
  it('refuse un candidat inexistant', async () => {
    await expect(schedule(reqOf(base({ candidateId: 'inconnu' }), rh, 'u_rh'))).rejects.toThrow();
  });
});

describe('updateInterview', () => {
  it('marque un entretien comme réalisé (audité)', async () => {
    const res: any = await schedule(reqOf(base(), rh, 'u_rh'));
    await update(reqOf({ id: res.id, status: 'realise' }, rh, 'u_rh'));
    const doc = await db.doc(`interviews/${res.id}`).get();
    expect(doc.get('status')).toBe('realise');
    const logs = await db.collection('auditLogs').where('action', '==', 'update_interview').get();
    expect(logs.size).toBeGreaterThanOrEqual(1);
  });
});
