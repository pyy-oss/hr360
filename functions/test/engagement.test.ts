import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import { fft, db, reqOf, clearFirestore, ORG } from './setup';
import { createEngagementSurvey } from '../src/engagement/createEngagementSurvey';
import { closeEngagementSurvey } from '../src/engagement/closeEngagementSurvey';
import { submitEngagementResponse } from '../src/engagement/submitEngagementResponse';
import { getEngagementResults } from '../src/engagement/getEngagementResults';

const create = fft.wrap(createEngagementSurvey);
const close = fft.wrap(closeEngagementSurvey);
const submit = fft.wrap(submitEngagementResponse);
const results = fft.wrap(getEngagementResults);

const drh = { role: 'drh' };
const rh = { role: 'rh' };
const collab = (emp: string) => ({ role: 'collaborateur', departmentId: 'cyber', employeeId: emp });

const questions = [{ key: 'sens', label: 'Sens' }, { key: 'charge', label: 'Charge' }];

beforeAll(async () => { await clearFirestore(); });
afterAll(() => fft.cleanup());
beforeEach(async () => { await clearFirestore(); });

describe('createEngagementSurvey', () => {
  it('la RH crée une enquête ouverte', async () => {
    const res: any = await create(reqOf({ title: 'Pulse', questions }, rh, 'u_rh'));
    const doc = await db.doc(`engagementSurveys/${res.id}`).get();
    expect(doc.get('status')).toBe('ouverte');
  });
  it('refuse des clés de question en double', async () => {
    await expect(create(reqOf({ title: 'X', questions: [{ key: 'a', label: 'A' }, { key: 'a', label: 'B' }] }, rh, 'u_rh'))).rejects.toThrow();
  });
  it('un collaborateur ne crée pas d’enquête', async () => {
    await expect(create(reqOf({ title: 'X', questions }, collab('e_ak'), 'u_ak'))).rejects.toThrow();
  });
});

describe('submitEngagementResponse — anonymat & anti double vote', () => {
  let surveyId: string;
  beforeEach(async () => { surveyId = (await create(reqOf({ title: 'Pulse', questions }, rh, 'u_rh')) as any).id; });

  it('un collaborateur répond ; contenu sans identité, marqueur de vote séparé', async () => {
    await submit(reqOf({ surveyId, scores: { sens: 5, charge: 3 } }, collab('e_ak'), 'u_ak'));
    const resp = await db.collection('engagementResponses').where('surveyId', '==', surveyId).get();
    expect(resp.size).toBe(1);
    const data = resp.docs[0].data();
    expect(data.scores.sens).toBe(5);
    expect(data.uid).toBeUndefined();          // aucune identité dans la réponse
    const vote = await db.doc(`engagementVotes/${surveyId}__u_ak`).get();
    expect(vote.exists).toBe(true);
    expect(vote.get('scores')).toBeUndefined(); // aucun score dans le marqueur
  });
  it('refuse un second vote du même utilisateur', async () => {
    await submit(reqOf({ surveyId, scores: { sens: 5, charge: 3 } }, collab('e_ak'), 'u_ak'));
    await expect(submit(reqOf({ surveyId, scores: { sens: 4, charge: 2 } }, collab('e_ak'), 'u_ak'))).rejects.toThrow();
  });
  it('refuse une clé de score inconnue', async () => {
    await expect(submit(reqOf({ surveyId, scores: { inconnu: 5 } }, collab('e_ak'), 'u_ak'))).rejects.toThrow();
  });
  it('refuse de répondre à une enquête fermée', async () => {
    await close(reqOf({ surveyId }, rh, 'u_rh'));
    await expect(submit(reqOf({ surveyId, scores: { sens: 5, charge: 3 } }, collab('e_ak'), 'u_ak'))).rejects.toThrow();
  });
});

describe('getEngagementResults — agrégats & seuil d’anonymat', () => {
  let surveyId: string;
  beforeEach(async () => { surveyId = (await create(reqOf({ title: 'Pulse', questions }, rh, 'u_rh')) as any).id; });

  it('masque les moyennes sous le seuil (< 3 réponses)', async () => {
    await submit(reqOf({ surveyId, scores: { sens: 5, charge: 3 } }, collab('e_1'), 'u_1'));
    await submit(reqOf({ surveyId, scores: { sens: 4, charge: 2 } }, collab('e_2'), 'u_2'));
    const r: any = await results(reqOf({ surveyId }, rh, 'u_rh'));
    expect(r.belowThreshold).toBe(true);
    expect(r.perQuestion[0].avg).toBe(null);
  });
  it('renvoie les moyennes au-dessus du seuil', async () => {
    await submit(reqOf({ surveyId, scores: { sens: 5, charge: 3 } }, collab('e_1'), 'u_1'));
    await submit(reqOf({ surveyId, scores: { sens: 4, charge: 2 } }, collab('e_2'), 'u_2'));
    await submit(reqOf({ surveyId, scores: { sens: 3, charge: 1 } }, collab('e_3'), 'u_3'));
    const r: any = await results(reqOf({ surveyId }, rh, 'u_rh'));
    expect(r.responseCount).toBe(3);
    expect(r.belowThreshold).toBe(false);
    expect(r.perQuestion.find((q: any) => q.key === 'sens').avg).toBe(4);
  });
  it('un collaborateur ne lit pas les résultats', async () => {
    await expect(results(reqOf({ surveyId }, collab('e_ak'), 'u_ak'))).rejects.toThrow();
  });
});
