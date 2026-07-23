/**
 * Nombre de jours ouvrés inclusifs (lun–ven) entre deux dates ISO `YYYY-MM-DD`.
 * Retourne 0 si l'une des dates est invalide ou si la fin précède le début.
 * Calcul en UTC pour éviter les décalages de fuseau à la frontière de journée.
 */
export function businessDays(startISO: string, endISO: string): number {
  const start = new Date(startISO);
  const end = new Date(endISO);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;
  let n = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const day = cur.getUTCDay();
    if (day !== 0 && day !== 6) n += 1;
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return n;
}
