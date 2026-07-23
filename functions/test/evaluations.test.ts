import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import { fft, db, reqOf, clearFirestore, ORG } from './setup';
import { openCampaignEvaluations } from '../src/objectifs/openCampaignEvaluations';
import { submitEvaluation } from '../src/objectifs/submitEvaluation';
import { publishEvaluation } from '../src/objectifs/publishEvaluation';

const open = fft.wrap(openCampaignEvaluations);
const submit = fft.wrap(submitEvaluation);
const publish = fft.wrap(publishEvaluation);

const drh = { role: 'drh' };
const rh = { role: 'rh' };
const mgrCyber = { role: 'manager', departmentId: 'cyber', employeeId: 'e_mgr' };
const mgrReseau = { role: 'manager', departmentId: 'reseau', employeeId: 'e_mgr2' };

beforeAll(async () => { await clearFirestore(); });
afterAll(() => fft.cleanup());
beforeEach(async () => { await clearFirestore(); });

async function seedCampaignAndEmployees() {
  await db.doc('objectiveCampaigns/c1').set({ orgId: ORG, year: 2026, name: '2026', phase: 'evaluation' });
  await db.doc('employees/e_ak').set({ orgId: ORG, firstName: 'A', lastName: 'K', departmentId: 'cyber' });
  await db.doc('employees/e_sk').set({ orgId: ORG, firstName: 'S', lastName: 'K', departmentId: 'infra' });
}

describe('openCampaignEvaluations', () => {
  beforeEach(seedCampaignAndEmployees);

  it('la RH ouvre les évaluations : une par collaborateur', async () => {
    const res: any = await open(reqOf({ campaignId: 'c1' }, rh, 'u_rh'));
    expect(res.created).toBe(2);
    const ev = await db.doc('evaluations/c1__e_ak').get();
    expect(ev.get('status')).toBe('en_cours');
    expect(ev.get('departmentId')).toBe('cyber');
  });

  it('idempotent : un second appel ne recrée rien', async () => {
    await open(reqOf({ campaignId: 'c1' }, rh, 'u_rh'));
    const res2: any = await open(reqOf({ campaignId: 'c1' }, rh, 'u_rh'));
    expect(res2.created).toBe(0);
  });

  it('refuse pour une campagne inexistante', async () => {
    await expect(open(reqOf({ campaignId: 'inconnue' }, rh, 'u_rh'))).rejects.toThrow();
  });

  it('un manager ne peut pas ouvrir les évaluations', async () => {
    await expect(open(reqOf({ campaignId: 'c1' }, mgrCyber, 'u_mgr'))).rejects.toThrow();
  });
});

describe('submitEvaluation → publishEvaluation', () => {
  beforeEach(async () => {
    await db.doc('evaluations/c1__e_ak').set({ orgId: ORG, campaignId: 'c1', employeeId: 'e_ak', departmentId: 'cyber', status: 'en_cours', selfAssessment: '', managerAssessment: '', rating: null });
  });

  it('le manager cyber soumet (en_cours → soumise) avec note', async () => {
    await submit(reqOf({ evaluationId: 'c1__e_ak', managerAssessment: 'Très bien', rating: 4 }, mgrCyber, 'u_mgr'));
    const ev = await db.doc('evaluations/c1__e_ak').get();
    expect(ev.get('status')).toBe('soumise');
    expect(ev.get('rating')).toBe(4);
  });

  it('le manager réseau ne soumet pas une évaluation « cyber »', async () => {
    await expect(submit(reqOf({ evaluationId: 'c1__e_ak', managerAssessment: 'X', rating: 3 }, mgrReseau, 'u_mgr2'))).rejects.toThrow();
  });

  it('refuse une note hors bornes', async () => {
    await expect(submit(reqOf({ evaluationId: 'c1__e_ak', managerAssessment: 'X', rating: 9 }, mgrCyber, 'u_mgr'))).rejects.toThrow();
  });

  it('refuse de soumettre deux fois (statut ≠ en_cours)', async () => {
    await submit(reqOf({ evaluationId: 'c1__e_ak', managerAssessment: 'X', rating: 3 }, mgrCyber, 'u_mgr'));
    await expect(submit(reqOf({ evaluationId: 'c1__e_ak', managerAssessment: 'Y', rating: 4 }, mgrCyber, 'u_mgr'))).rejects.toThrow();
  });

  it('cycle complet : soumise puis publiée par la DRH', async () => {
    await submit(reqOf({ evaluationId: 'c1__e_ak', managerAssessment: 'Bien', rating: 4 }, mgrCyber, 'u_mgr'));
    await publish(reqOf({ evaluationId: 'c1__e_ak' }, drh, 'u_drh'));
    const ev = await db.doc('evaluations/c1__e_ak').get();
    expect(ev.get('status')).toBe('publiee');
  });
});
