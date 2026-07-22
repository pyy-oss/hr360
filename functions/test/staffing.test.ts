import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import { fft, db, reqOf, clearFirestore, ORG } from './setup';
import { upsertAssignment } from '../src/staffing/upsertAssignment';

const assign = fft.wrap(upsertAssignment);
const drh = { role: 'drh' };
const mgrCyber = { role: 'manager', departmentId: 'cyber', employeeId: 'e_mgr' };
const mgrReseau = { role: 'manager', departmentId: 'reseau', employeeId: 'e_mgr2' };

const base = (over: Partial<Record<string, unknown>> = {}) => ({
  missionId: 'm1', employeeId: 'e_collab', departmentId: 'cyber',
  allocationPct: 50, startDate: '2026-01-01', endDate: '2026-06-30', status: 'active', ...over,
});

beforeAll(async () => { await clearFirestore(); });
afterAll(() => fft.cleanup());
beforeEach(async () => { await clearFirestore(); });

describe('upsertAssignment — garde anti sur-allocation', () => {
  it('accepte une première affectation à 50%', async () => {
    const res: any = await assign(reqOf(base(), drh, 'u_drh'));
    const doc = await db.doc(`assignments/${res.id}`).get();
    expect(doc.get('allocationPct')).toBe(50);
  });

  it('accepte deux affectations chevauchantes qui totalisent 100%', async () => {
    await assign(reqOf(base({ allocationPct: 50 }), drh, 'u_drh'));
    const res: any = await assign(reqOf(base({ allocationPct: 50 }), drh, 'u_drh'));
    expect(res.ok).toBe(true);
  });

  it('refuse un dépassement de 100% sur des périodes qui se chevauchent', async () => {
    await assign(reqOf(base({ allocationPct: 70 }), drh, 'u_drh'));
    await expect(assign(reqOf(base({ allocationPct: 40 }), drh, 'u_drh')))
      .rejects.toThrow();
  });

  it('autorise 100% + 100% si les périodes ne se chevauchent pas', async () => {
    await assign(reqOf(base({ allocationPct: 100, startDate: '2026-01-01', endDate: '2026-03-31' }), drh, 'u_drh'));
    const res: any = await assign(reqOf(base({ allocationPct: 100, startDate: '2026-04-01', endDate: '2026-06-30' }), drh, 'u_drh'));
    expect(res.ok).toBe(true);
  });

  it('le manager d’un autre département ne peut pas affecter sur « cyber »', async () => {
    await expect(assign(reqOf(base(), mgrReseau, 'u_mgr2'))).rejects.toThrow();
  });

  it('le manager du département peut affecter sur son équipe', async () => {
    const res: any = await assign(reqOf(base({ allocationPct: 30 }), mgrCyber, 'u_mgr'));
    expect(res.ok).toBe(true);
  });

  it('refuse la mise à jour d’une affectation d’une AUTRE organisation', async () => {
    await db.doc('assignments/a_foreign').set({
      orgId: 'autre-org', departmentId: 'cyber', employeeId: 'e_collab', missionId: 'm1',
      allocationPct: 20, startDate: '2026-01-01', endDate: '2026-06-30', status: 'active',
    });
    await expect(assign(reqOf(base({ id: 'a_foreign' }), drh, 'u_drh')))
      .rejects.toThrow();
  });
});
