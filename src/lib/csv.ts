/**
 * Utilitaires d'export CSV — purs, sans dépendance (CSP stricte : aucune lib externe).
 *
 * Séparateur « ; » (et non « , ») : c'est le délimiteur attendu par Excel en
 * locale française. Le fichier est préfixé d'un BOM UTF-8 pour qu'Excel affiche
 * correctement les accents. Aucune donnée n'est transformée ici : on sérialise
 * telles quelles les lignes fournies par les hooks réels.
 */

export interface CsvColumn {
  /** Clé lue dans chaque ligne. */
  key: string;
  /** En-tête affiché dans le fichier. */
  label: string;
}

/** Échappe une cellule : guillemets doublés, encadrement si `;`, `"` ou saut de ligne. */
function escapeCell(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value);
  if (/[";\n\r]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

/**
 * Construit le contenu CSV. L'en-tête reprend les `label` des colonnes, chaque
 * ligne lit les valeurs par `key`. Lignes séparées par CRLF (compatibilité Excel).
 */
export function toCsv(rows: Record<string, unknown>[], columns: CsvColumn[]): string {
  const header = columns.map((c) => escapeCell(c.label)).join(';');
  const body = rows.map((row) => columns.map((c) => escapeCell(row[c.key])).join(';'));
  return [header, ...body].join('\r\n');
}

/**
 * Déclenche le téléchargement d'un CSV. Blob `text/csv;charset=utf-8` préfixé du
 * BOM UTF-8 (﻿), via une ancre `<a download>` éphémère. L'URL objet est
 * révoquée après le clic pour éviter toute fuite mémoire.
 */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
