import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import { fft, db, clearFirestore, ORG } from './setup';
import { assertAndCountAiQuota, AI_DAILY_LIMIT } from '../src/ai/quota';

const day = () => new Date().toISOString().slice(0, 10);
const quotaRef = (uid: string) => db.doc(`aiQuota/${uid}_${day()}`);

beforeAll(async () => { await clearFirestore(); });
afterAll(() => fft.cleanup());
beforeEach(async () => { await clearFirestore(); });

describe('assertAndCountAiQuota — quota IA journalier', () => {
  it('premier appel : crée le compteur à 1', async () => {
    await assertAndCountAiQuota('u1', ORG);
    const snap = await quotaRef('u1').get();
    expect(snap.get('count')).toBe(1);
    expect(snap.get('orgId')).toBe(ORG);
    expect(snap.get('day')).toBe(day());
  });

  it('appels successifs : incrémente le compteur', async () => {
    await assertAndCountAiQuota('u2', ORG);
    await assertAndCountAiQuota('u2', ORG);
    await assertAndCountAiQuota('u2', ORG);
    const snap = await quotaRef('u2').get();
    expect(snap.get('count')).toBe(3);
  });

  it('limite atteinte : lève resource-exhausted et n’incrémente pas', async () => {
    await quotaRef('u3').set({ orgId: ORG, uid: 'u3', day: day(), count: AI_DAILY_LIMIT });
    await expect(assertAndCountAiQuota('u3', ORG)).rejects.toThrow(/Quota IA journalier/);
    const snap = await quotaRef('u3').get();
    expect(snap.get('count')).toBe(AI_DAILY_LIMIT);
  });

  it('dernier appel autorisé (limite - 1) : passe puis bloque le suivant', async () => {
    await quotaRef('u4').set({ orgId: ORG, uid: 'u4', day: day(), count: AI_DAILY_LIMIT - 1 });
    await assertAndCountAiQuota('u4', ORG); // atteint la limite
    await expect(assertAndCountAiQuota('u4', ORG)).rejects.toThrow(/Quota IA journalier/);
  });

  it('compteurs isolés par utilisateur', async () => {
    await assertAndCountAiQuota('u5', ORG);
    await assertAndCountAiQuota('u6', ORG);
    await assertAndCountAiQuota('u6', ORG);
    expect((await quotaRef('u5').get()).get('count')).toBe(1);
    expect((await quotaRef('u6').get()).get('count')).toBe(2);
  });
});
