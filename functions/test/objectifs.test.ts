import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import { fft, db, reqOf, clearFirestore, ORG } from './setup';
import { advanceCampaignPhase } from '../src/objectifs/advanceCampaignPhase';
import { publishEvaluation } from '../src/objectifs/publishEvaluation';

const advance = fft.wrap(advanceCampaignPhase);
const publish = fft.wrap(publishEvaluation);
const drh = { role: 'drh' };
const rh = { role: 'rh' };
const mgrCyber = { role: 'manager', departmentId: 'cyber', employeeId: 'e_mgr' };

beforeAll(async () => { await clearFirestore(); });
afterAll(() => fft.cleanup());
beforeEach(async () => { await clearFirestore(); });

describe('advanceCampaignPhase', () => {
  beforeEach(async () => {
    await db.doc('objectiveCampaigns/c1').set({ orgId: ORG, year: 2026, name: '2026', phase: 'preparation' });
  });
  it('la DRH avance d’une phase (preparation → fixation)', async () => {
    await advance(reqOf({ campaignId: 'c1', toPhase: 'fixation' }, drh, 'u_drh'));
    const c = await db.doc('objectiveCampaigns/c1').get();
    expect(c.get('phase')).toBe('fixation');
  });
  it('refuse un saut de phase (preparation → evaluation)', async () => {
    await expect(advance(reqOf({ campaignId: 'c1', toPhase: 'evaluation' }, drh, 'u_drh')))
      .rejects.toThrow();
  });
  it('refuse l’avancement par un non-DRH', async () => {
    await expect(advance(reqOf({ campaignId: 'c1', toPhase: 'fixation' }, rh, 'u_rh')))
      .rejects.toThrow();
  });
});

describe('publishEvaluation', () => {
  it('publie une évaluation « soumise » (manager) → visible', async () => {
    await db.doc('evaluations/ev1').set({ orgId: ORG, employeeId: 'e_collab', departmentId: 'cyber', status: 'soumise' });
    await publish(reqOf({ evaluationId: 'ev1' }, mgrCyber, 'u_mgr'));
    const ev = await db.doc('evaluations/ev1').get();
    expect(ev.get('status')).toBe('publiee');
  });
  it('refuse de publier une évaluation non « soumise »', async () => {
    await db.doc('evaluations/ev2').set({ orgId: ORG, employeeId: 'e_collab', departmentId: 'cyber', status: 'en_cours' });
    await expect(publish(reqOf({ evaluationId: 'ev2' }, mgrCyber, 'u_mgr'))).rejects.toThrow();
  });
});
