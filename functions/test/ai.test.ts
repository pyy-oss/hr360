import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import { fft, clearFirestore } from './setup';
import { aiAssistant } from '../src/ai/aiAssistant';

const assistant = fft.wrap(aiAssistant);
const rh = { role: 'rh' };

beforeAll(async () => { await clearFirestore(); });
afterAll(() => fft.cleanup());
beforeEach(async () => { await clearFirestore(); });

// On teste les GARDES (RBAC + validation) qui s'exécutent AVANT tout appel réseau à
// Claude — l'appel réel nécessite le secret + le réseau et n'est pas testé ici.
describe('aiAssistant — gardes', () => {
  it('refuse un appel non authentifié', async () => {
    await expect(assistant({ data: { message: 'Bonjour' }, auth: undefined } as any)).rejects.toThrow();
  });
  it('refuse un message vide (validation zod, avant tout appel Claude)', async () => {
    await expect(assistant({ data: { message: '' }, auth: { uid: 'u_rh', token: { orgId: 'neurones', ...rh } } } as any)).rejects.toThrow();
  });
  it('refuse un utilisateur sans rôle', async () => {
    await expect(assistant({ data: { message: 'Bonjour' }, auth: { uid: 'u_x', token: { orgId: 'neurones' } } } as any)).rejects.toThrow();
  });
});
