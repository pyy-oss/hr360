import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import { fft, db, reqOf, clearFirestore, count, ORG } from './setup';
import { submitLeaveRequest } from '../src/absences/submitLeaveRequest';
import { decideLeaveRequest } from '../src/absences/decideLeaveRequest';

const submit = fft.wrap(submitLeaveRequest);
const decide = fft.wrap(decideLeaveRequest);

const collab = { role: 'collaborateur', employeeId: 'e_collab', departmentId: 'cyber' };
const mgrCyber = { role: 'manager', departmentId: 'cyber', employeeId: 'e_mgr' };
const mgrReseau = { role: 'manager', departmentId: 'reseau', employeeId: 'e_mgr2' };

beforeAll(async () => { await clearFirestore(); });
afterAll(() => fft.cleanup());
beforeEach(async () => {
  await clearFirestore();
  await db.doc('employees/e_collab').set({ orgId: ORG, departmentId: 'cyber', uid: 'u_collab' });
  await db.doc('leaveBalances/e_collab').set({
    orgId: ORG, employeeId: 'e_collab', departmentId: 'cyber',
    entitlements: { conges_payes: 26 }, taken: {}, pending: {},
  });
});

describe('submitLeaveRequest', () => {
  it('crée la demande en « soumis » et réserve les jours en pending', async () => {
    const res: any = await submit(reqOf(
      { type: 'conges_payes', startDate: '2026-08-01', endDate: '2026-08-05', days: 5 },
      collab, 'u_collab',
    ));
    const doc = await db.doc(`leaveRequests/${res.id}`).get();
    expect(doc.get('status')).toBe('soumis');
    const bal = await db.doc('leaveBalances/e_collab').get();
    expect(bal.get('pending.conges_payes')).toBe(5);
  });

  it('refuse si le solde est insuffisant', async () => {
    await expect(submit(reqOf(
      { type: 'conges_payes', startDate: '2026-08-01', endDate: '2026-12-31', days: 40 },
      collab, 'u_collab',
    ))).rejects.toThrow();
  });

  it('refuse une date de fin antérieure à la date de début', async () => {
    await expect(submit(reqOf(
      { type: 'rtt', startDate: '2026-08-10', endDate: '2026-08-01', days: 1 },
      collab, 'u_collab',
    ))).rejects.toThrow();
  });
});

describe('decideLeaveRequest', () => {
  beforeEach(async () => {
    await db.doc('leaveRequests/lr1').set({
      orgId: ORG, employeeId: 'e_collab', departmentId: 'cyber',
      type: 'conges_payes', status: 'soumis', days: 4,
    });
    await db.doc('leaveBalances/e_collab').set({
      pending: { conges_payes: 4 }, taken: { conges_payes: 0 },
    }, { merge: true });
  });

  it('approbation par le manager : pending → taken + audit', async () => {
    await decide(reqOf({ id: 'lr1', decision: 'approuve' }, mgrCyber, 'u_mgr'));
    const lr = await db.doc('leaveRequests/lr1').get();
    expect(lr.get('status')).toBe('approuve');
    const bal = await db.doc('leaveBalances/e_collab').get();
    expect(bal.get('taken.conges_payes')).toBe(4);
    expect(bal.get('pending.conges_payes')).toBe(0);
    expect(await count('auditLogs')).toBeGreaterThan(0);
  });

  it('refuse la décision par un manager d’un autre département', async () => {
    await expect(decide(reqOf({ id: 'lr1', decision: 'approuve' }, mgrReseau, 'u_mgr2')))
      .rejects.toThrow();
  });

  it('refuse la décision par le collaborateur lui-même', async () => {
    await expect(decide(reqOf({ id: 'lr1', decision: 'approuve' }, collab, 'u_collab')))
      .rejects.toThrow();
  });

  it('refuse qu’un manager approuve SA PROPRE demande (ségrégation des tâches)', async () => {
    await db.doc('leaveRequests/lr_self').set({
      orgId: ORG, employeeId: 'e_mgr', departmentId: 'cyber',
      type: 'conges_payes', status: 'soumis', days: 2,
    });
    await expect(decide(reqOf({ id: 'lr_self', decision: 'approuve' }, mgrCyber, 'u_mgr')))
      .rejects.toThrow();
  });

  it('refuse une décision sur une demande d’une AUTRE organisation', async () => {
    await db.doc('leaveRequests/lr_foreign').set({
      orgId: 'autre-org', employeeId: 'e_x', departmentId: 'cyber',
      type: 'conges_payes', status: 'soumis', days: 2,
    });
    await expect(decide(reqOf({ id: 'lr_foreign', decision: 'approuve' }, mgrCyber, 'u_mgr')))
      .rejects.toThrow();
  });

  it('refuse de re-traiter une demande déjà décidée', async () => {
    await decide(reqOf({ id: 'lr1', decision: 'approuve' }, mgrCyber, 'u_mgr'));
    await expect(decide(reqOf({ id: 'lr1', decision: 'refuse' }, mgrCyber, 'u_mgr')))
      .rejects.toThrow();
  });
});
