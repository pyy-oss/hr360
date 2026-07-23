import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import { fft, db, reqOf, clearFirestore, ORG } from './setup';
import { captureMetricsSnapshot } from '../src/metrics/captureMetricsSnapshot';

const capture = fft.wrap(captureMetricsSnapshot);
const drh = { role: 'drh' };
const collab = { role: 'collaborateur', departmentId: 'infra', employeeId: 'e_at' };

const today = () => new Date().toISOString().slice(0, 10);

beforeAll(async () => { await clearFirestore(); });
afterAll(() => fft.cleanup());
beforeEach(async () => {
  await clearFirestore();
  await db.doc('employees/e1').set({ orgId: ORG, status: 'confirme', departmentId: 'infra' });
  await db.doc('employees/e2').set({ orgId: ORG, status: 'confirme', departmentId: 'cyber' });
  await db.doc('employees/e3').set({ orgId: ORG, status: 'essai', departmentId: 'infra' });
});

describe('captureMetricsSnapshot', () => {
  it('la DRH fige un instantané daté avec les effectifs', async () => {
    const res: any = await capture(reqOf({}, drh, 'u_drh'));
    expect(res.ok).toBe(true);
    expect(res.day).toBe(today());
    const snap = await db.doc(`metricSnapshots/${ORG}_${today()}`).get();
    expect(snap.get('headcount')).toBe(3);
    expect(snap.get('essai')).toBe(1);
    expect(snap.get('confirme')).toBe(2);
  });

  it('ré-appeler le même jour écrase (idempotent sur la journée)', async () => {
    await capture(reqOf({}, drh, 'u_drh'));
    await db.doc('employees/e4').set({ orgId: ORG, status: 'confirme', departmentId: 'infra' });
    await capture(reqOf({}, drh, 'u_drh'));
    const snap = await db.doc(`metricSnapshots/${ORG}_${today()}`).get();
    expect(snap.get('headcount')).toBe(4);
  });

  it('un collaborateur ne peut pas figer d’instantané', async () => {
    await expect(capture(reqOf({}, collab, 'u_at'))).rejects.toThrow();
  });

  it('écrit une entrée d’audit', async () => {
    await capture(reqOf({}, drh, 'u_drh'));
    const logs = await db.collection('auditLogs').where('action', '==', 'capture_metrics_snapshot').get();
    expect(logs.size).toBeGreaterThanOrEqual(1);
  });
});
