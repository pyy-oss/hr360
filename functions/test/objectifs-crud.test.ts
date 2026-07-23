import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import { fft, db, reqOf, clearFirestore, ORG } from './setup';
import { createObjectiveCampaign } from '../src/objectifs/createObjectiveCampaign';
import { upsertObjective } from '../src/objectifs/upsertObjective';

const createCampaign = fft.wrap(createObjectiveCampaign);
const upsert = fft.wrap(upsertObjective);

const drh = { role: 'drh' };
const rh = { role: 'rh' };
const mgrCyber = { role: 'manager', departmentId: 'cyber', employeeId: 'e_mgr' };
const mgrReseau = { role: 'manager', departmentId: 'reseau', employeeId: 'e_mgr2' };
const collabCyber = { role: 'collaborateur', departmentId: 'cyber', employeeId: 'e_ak' };

const objBase = (over: Record<string, unknown> = {}) => ({
  campaignId: 'c1', employeeId: 'e_ak', departmentId: 'cyber',
  title: 'Réduire le délai d’audit', measure: '≤ 15 j', weight: 40, ...over,
});

beforeAll(async () => { await clearFirestore(); });
afterAll(() => fft.cleanup());
beforeEach(async () => { await clearFirestore(); });

describe('createObjectiveCampaign', () => {
  it('la DRH crée une campagne en phase « preparation »', async () => {
    const res: any = await createCampaign(reqOf({ name: '2026', year: 2026 }, drh, 'u_drh'));
    const doc = await db.doc(`objectiveCampaigns/${res.id}`).get();
    expect(doc.get('phase')).toBe('preparation');
    expect(doc.get('orgId')).toBe(ORG);
  });
  it('la RH ne crée pas de campagne (réservé DRH)', async () => {
    await expect(createCampaign(reqOf({ name: 'X', year: 2026 }, rh, 'u_rh'))).rejects.toThrow();
  });
  it('refuse une année hors bornes', async () => {
    await expect(createCampaign(reqOf({ name: 'X', year: 1999 }, drh, 'u_drh'))).rejects.toThrow();
  });
});

describe('upsertObjective', () => {
  it('le manager crée un objectif brouillon pour son équipe', async () => {
    const res: any = await upsert(reqOf(objBase(), mgrCyber, 'u_mgr'));
    const doc = await db.doc(`objectives/${res.id}`).get();
    expect(doc.get('status')).toBe('brouillon');
    expect(doc.get('weight')).toBe(40);
  });
  it('le collaborateur propose SON propre objectif', async () => {
    const res: any = await upsert(reqOf(objBase(), collabCyber, 'u_ak'));
    expect(res.ok).toBe(true);
  });
  it('le manager d’un autre département ne crée pas un objectif « cyber »', async () => {
    await expect(upsert(reqOf(objBase(), mgrReseau, 'u_mgr2'))).rejects.toThrow();
  });
  it('un collaborateur ne crée pas l’objectif d’un autre', async () => {
    await expect(upsert(reqOf(objBase({ employeeId: 'e_autre' }), collabCyber, 'u_ak'))).rejects.toThrow();
  });
  it('refuse une pondération > 100', async () => {
    await expect(upsert(reqOf(objBase({ weight: 120 }), mgrCyber, 'u_mgr'))).rejects.toThrow();
  });
  it('interdit la modification d’un objectif déjà validé', async () => {
    await db.doc('objectives/o_val').set({ orgId: ORG, campaignId: 'c1', employeeId: 'e_ak', departmentId: 'cyber', title: 'X', measure: 'y', weight: 50, status: 'valide' });
    await expect(upsert(reqOf(objBase({ id: 'o_val' }), mgrCyber, 'u_mgr'))).rejects.toThrow();
  });
  it('refuse la mise à jour d’un objectif d’une AUTRE organisation', async () => {
    await db.doc('objectives/o_foreign').set({ orgId: 'autre-org', campaignId: 'c1', employeeId: 'e_ak', departmentId: 'cyber', title: 'X', measure: 'y', weight: 50, status: 'brouillon' });
    await expect(upsert(reqOf(objBase({ id: 'o_foreign' }), drh, 'u_drh'))).rejects.toThrow();
  });
});
