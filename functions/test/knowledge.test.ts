import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import { fft, db, reqOf, clearFirestore, ORG } from './setup';
import { upsertKnowledgeDoc } from '../src/knowledge/upsertKnowledgeDoc';
import { askKnowledge } from '../src/ai/askKnowledge';

const upsert = fft.wrap(upsertKnowledgeDoc);
const ask = fft.wrap(askKnowledge);

const rh = { role: 'rh' };
const collab = { role: 'collaborateur', departmentId: 'cyber', employeeId: 'e_ak' };

const docBase = (over: Record<string, unknown> = {}) => ({ title: 'Congés', category: 'procedure', content: 'Au-delà de 10 jours, validation DRH.', ...over });

beforeAll(async () => { await clearFirestore(); });
afterAll(() => fft.cleanup());
beforeEach(async () => { await clearFirestore(); });

describe('upsertKnowledgeDoc', () => {
  it('la RH crée un document de référence (audité)', async () => {
    const res: any = await upsert(reqOf(docBase(), rh, 'u_rh'));
    const doc = await db.doc(`knowledgeDocs/${res.id}`).get();
    expect(doc.get('orgId')).toBe(ORG);
    expect(doc.get('title')).toBe('Congés');
    const logs = await db.collection('auditLogs').where('action', '==', 'create_knowledge_doc').get();
    expect(logs.size).toBeGreaterThanOrEqual(1);
  });
  it('un collaborateur ne crée pas de document', async () => {
    await expect(upsert(reqOf(docBase(), collab, 'u_ak'))).rejects.toThrow();
  });
  it('refuse un contenu vide (validation)', async () => {
    await expect(upsert(reqOf(docBase({ content: '' }), rh, 'u_rh'))).rejects.toThrow();
  });
});

describe('askKnowledge — gardes & base vide', () => {
  it('refuse un appel non authentifié', async () => {
    await expect(ask({ data: { question: 'Congés ?' }, auth: undefined } as any)).rejects.toThrow();
  });
  it('refuse une question vide', async () => {
    await expect(ask(reqOf({ question: '' }, rh, 'u_rh'))).rejects.toThrow();
  });
  it('base vide → réponse sans appel modèle (docCount 0)', async () => {
    const res: any = await ask(reqOf({ question: 'Congés ?' }, rh, 'u_rh'));
    expect(res.docCount).toBe(0);
    expect(res.ok).toBe(true);
  });
});
