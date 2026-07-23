import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import { fft, db, reqOf, clearFirestore, ORG } from './setup';
import { upsertSalaryBand } from '../src/remuneration/upsertSalaryBand';
import { setCompensation } from '../src/remuneration/setCompensation';

const band = fft.wrap(upsertSalaryBand);
const setComp = fft.wrap(setCompensation);

const drh = { role: 'drh' };
const rh = { role: 'rh' };
const mgr = { role: 'manager', departmentId: 'cyber', employeeId: 'e_mgr' };
const collab = { role: 'collaborateur', departmentId: 'cyber', employeeId: 'e_ak' };

const bandBase = (over: Record<string, unknown> = {}) => ({
  level: 'confirme', label: 'P2', minAmount: 7200000, midAmount: 9000000, maxAmount: 10800000, ...over,
});
const compBase = (over: Record<string, unknown> = {}) => ({
  employeeId: 'e_ak', departmentId: 'cyber', bandLevel: 'junior',
  baseSalary: 6300000, effectiveDate: '2026-06-01', reason: 'Embauche', ...over,
});

beforeAll(async () => { await clearFirestore(); });
afterAll(() => fft.cleanup());
beforeEach(async () => { await clearFirestore(); });

describe('upsertSalaryBand', () => {
  it('la DRH définit une bande (id = palier)', async () => {
    const res: any = await band(reqOf(bandBase(), drh, 'u_drh'));
    expect(res.id).toBe('confirme');
    const doc = await db.doc('salaryBands/confirme').get();
    expect(doc.get('midAmount')).toBe(9000000);
  });
  it('la RH ne définit pas de bande (réservé DRH)', async () => {
    await expect(band(reqOf(bandBase(), rh, 'u_rh'))).rejects.toThrow();
  });
  it('refuse des montants non ordonnés', async () => {
    await expect(band(reqOf(bandBase({ minAmount: 9999999, midAmount: 1, maxAmount: 2 }), drh, 'u_drh'))).rejects.toThrow();
  });
});

describe('setCompensation', () => {
  it('la RH pose une rémunération (id = employeeId) et journalise l’audit', async () => {
    const res: any = await setComp(reqOf(compBase(), rh, 'u_rh'));
    expect(res.previous).toBe(null);
    const doc = await db.doc('compensations/e_ak').get();
    expect(doc.get('baseSalary')).toBe(6300000);
    const logs = await db.collection('auditLogs').where('action', '==', 'create_compensation').get();
    expect(logs.size).toBeGreaterThanOrEqual(1);
  });

  it('un ajustement journalise l’avant/après', async () => {
    await setComp(reqOf(compBase({ baseSalary: 6300000 }), rh, 'u_rh'));
    const res: any = await setComp(reqOf(compBase({ baseSalary: 6800000, reason: 'Revue annuelle' }), drh, 'u_drh'));
    expect(res.previous).toBe(6300000);
    const doc = await db.doc('compensations/e_ak').get();
    expect(doc.get('baseSalary')).toBe(6800000);
    const logs = await db.collection('auditLogs').where('action', '==', 'update_compensation').get();
    expect(logs.size).toBeGreaterThanOrEqual(1);
  });

  it('le manager ne pose pas de rémunération', async () => {
    await expect(setComp(reqOf(compBase(), mgr, 'u_mgr'))).rejects.toThrow();
  });
  it('le collaborateur ne pose pas de rémunération', async () => {
    await expect(setComp(reqOf(compBase(), collab, 'u_ak'))).rejects.toThrow();
  });
  it('refuse un salaire négatif', async () => {
    await expect(setComp(reqOf(compBase({ baseSalary: -1 }), rh, 'u_rh'))).rejects.toThrow();
  });
});
