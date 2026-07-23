import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import { fft, db, reqOf, clearFirestore, ORG } from './setup';
import { upsertPosition } from '../src/recrutement/upsertPosition';
import { upsertCandidate } from '../src/recrutement/upsertCandidate';
import { advanceCandidateStage } from '../src/recrutement/advanceCandidateStage';

const position = fft.wrap(upsertPosition);
const candidate = fft.wrap(upsertCandidate);
const advance = fft.wrap(advanceCandidateStage);

const drh = { role: 'drh' };
const rh = { role: 'rh' };
const mgrCyber = { role: 'manager', departmentId: 'cyber', employeeId: 'e_mgr' };
const mgrReseau = { role: 'manager', departmentId: 'reseau', employeeId: 'e_mgr2' };
const collab = { role: 'collaborateur', departmentId: 'cyber', employeeId: 'e_collab' };

const posBase = (over: Record<string, unknown> = {}) => ({
  title: 'Consultant Cyber', departmentId: 'cyber', level: 'confirme', contractType: 'cdi',
  openings: 1, status: 'ouvert', mustSkills: ['Pentest'], niceSkills: [], excludedCriteria: ['age'],
  weights: { technique: 50, experience: 25, soft: 15, formation: 10 }, ...over,
});
const candBase = (over: Record<string, unknown> = {}) => ({
  firstName: 'Salif', lastName: 'Guéï', email: 's.guei@example.ci', source: 'site',
  positionId: 'p1', departmentId: 'cyber', yearsExperience: 5, stage: 'nouveau', tags: [], ...over,
});

beforeAll(async () => { await clearFirestore(); });
afterAll(() => fft.cleanup());
beforeEach(async () => { await clearFirestore(); });

describe('upsertPosition', () => {
  it('RH crée un poste avec pondérations valides', async () => {
    const res: any = await position(reqOf(posBase(), rh, 'u_rh'));
    const doc = await db.doc(`positions/${res.id}`).get();
    expect(doc.get('orgId')).toBe(ORG);
    expect(doc.get('title')).toBe('Consultant Cyber');
  });

  it('refuse des pondérations dont la somme ≠ 100', async () => {
    await expect(position(reqOf(posBase({ weights: { technique: 50, experience: 25, soft: 15, formation: 5 } }), rh, 'u_rh')))
      .rejects.toThrow();
  });

  it('le manager d’un autre département ne crée pas un poste « cyber »', async () => {
    await expect(position(reqOf(posBase(), mgrReseau, 'u_mgr2'))).rejects.toThrow();
  });

  it('le collaborateur ne crée pas de poste', async () => {
    await expect(position(reqOf(posBase(), collab, 'u_collab'))).rejects.toThrow();
  });

  it('refuse la mise à jour d’un poste d’une AUTRE organisation', async () => {
    await db.doc('positions/p_foreign').set({ orgId: 'autre-org', departmentId: 'cyber', title: 'X', level: 'junior', status: 'ouvert' });
    await expect(position(reqOf(posBase({ id: 'p_foreign' }), drh, 'u_drh'))).rejects.toThrow();
  });
});

describe('upsertCandidate', () => {
  it('RH crée un candidat (avec appliedAt)', async () => {
    const res: any = await candidate(reqOf(candBase(), rh, 'u_rh'));
    const doc = await db.doc(`candidates/${res.id}`).get();
    expect(doc.get('orgId')).toBe(ORG);
    expect(doc.get('stage')).toBe('nouveau');
    expect(doc.get('appliedAt')).toBeTruthy();
  });

  it('le manager cyber crée un candidat de son département', async () => {
    const res: any = await candidate(reqOf(candBase(), mgrCyber, 'u_mgr'));
    expect(res.ok).toBe(true);
  });

  it('le manager réseau ne crée pas un candidat « cyber »', async () => {
    await expect(candidate(reqOf(candBase(), mgrReseau, 'u_mgr2'))).rejects.toThrow();
  });

  it('le collaborateur ne crée pas de candidat', async () => {
    await expect(candidate(reqOf(candBase(), collab, 'u_collab'))).rejects.toThrow();
  });

  it('email invalide rejeté', async () => {
    await expect(candidate(reqOf(candBase({ email: 'pas-un-email' }), rh, 'u_rh'))).rejects.toThrow();
  });
});

describe('advanceCandidateStage', () => {
  beforeEach(async () => {
    await db.doc('candidates/c1').set({ orgId: ORG, departmentId: 'cyber', firstName: 'S', lastName: 'G', email: 's@x.ci', source: 'site', stage: 'nouveau', yearsExperience: 5 });
  });

  it('RH fait avancer le candidat et journalise la transition', async () => {
    const res: any = await advance(reqOf({ id: 'c1', stage: 'entretien' }, rh, 'u_rh'));
    expect(res.stage).toBe('entretien');
    const doc = await db.doc('candidates/c1').get();
    expect(doc.get('stage')).toBe('entretien');
  });

  it('un candidat « embauche » est terminal (transition refusée)', async () => {
    await db.doc('candidates/c1').update({ stage: 'embauche' });
    await expect(advance(reqOf({ id: 'c1', stage: 'vivier' }, rh, 'u_rh'))).rejects.toThrow();
  });

  it('le manager réseau ne fait pas avancer un candidat « cyber »', async () => {
    await expect(advance(reqOf({ id: 'c1', stage: 'entretien' }, mgrReseau, 'u_mgr2'))).rejects.toThrow();
  });

  it('refuse la transition sur un candidat d’une AUTRE organisation', async () => {
    await db.doc('candidates/c_foreign').set({ orgId: 'autre-org', departmentId: 'cyber', firstName: 'X', lastName: 'Y', email: 'x@y.ci', source: 'site', stage: 'nouveau', yearsExperience: 2 });
    await expect(advance(reqOf({ id: 'c_foreign', stage: 'entretien' }, drh, 'u_drh'))).rejects.toThrow();
  });

  it('écrit une entrée d’audit à chaque transition', async () => {
    await advance(reqOf({ id: 'c1', stage: 'preselection', comment: 'CV pertinent' }, rh, 'u_rh'));
    const logs = await db.collection('auditLogs').where('action', '==', 'advance_candidate_stage').get();
    expect(logs.size).toBeGreaterThanOrEqual(1);
  });
});
