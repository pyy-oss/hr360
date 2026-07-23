import { defineSecret } from 'firebase-functions/params';
import Anthropic from '@anthropic-ai/sdk';

/**
 * Clé API Anthropic — SECRET Firebase Functions. Jamais côté client, jamais en dur.
 * Poser la valeur avec :  firebase functions:secrets:set ANTHROPIC_API_KEY
 * Toute fonction IA doit déclarer ce secret dans ses options onCall pour y accéder.
 */
export const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');

// Modèle par défaut de la couche IA (le plus capable). Voir docs Claude.
export const AI_MODEL = 'claude-opus-4-8';

/** Client Anthropic construit à partir du secret (à appeler dans le corps d'une fonction). */
export function getAnthropic(): Anthropic {
  return new Anthropic({ apiKey: ANTHROPIC_API_KEY.value() });
}

/** Concatène les blocs texte d'une réponse Messages en une chaîne. */
export function textOf(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
}
