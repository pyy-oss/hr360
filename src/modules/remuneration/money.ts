/** Formate un montant entier en FCFA (XOF) — séparateurs d'espace, sans décimales. */
export function money(amount?: number | null, currency = 'XOF'): string {
  if (amount == null) return '—';
  const n = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount);
  return currency === 'XOF' ? `${n} FCFA` : `${n} ${currency}`;
}
