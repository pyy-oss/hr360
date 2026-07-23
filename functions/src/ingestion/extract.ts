import AdmZip from 'adm-zip';

export const ACCEPTED_EXT = ['pdf', 'doc', 'docx'];

export interface ExtractedFile { name: string; data: Buffer; }

/** Nom de base sûr (sans chemin), pour éviter la traversée de répertoire. */
export function safeBaseName(entryName: string): string {
  const base = entryName.split(/[\\/]/).pop() ?? entryName;
  return base.replace(/[^\w.\- ]+/g, '_').slice(0, 180);
}

export function extOf(name: string): string {
  return name.includes('.') ? name.split('.').pop()!.toLowerCase() : '';
}

/**
 * Extrait d'une archive ZIP les fichiers de type accepté (pdf/doc/docx), en
 * ignorant dossiers, entrées cachées et artefacts macOS. Fonction pure (testable).
 */
export function extractAcceptedFiles(zipBuffer: Buffer): { files: ExtractedFile[]; skipped: number } {
  const zip = new AdmZip(zipBuffer);
  const files: ExtractedFile[] = [];
  let skipped = 0;
  for (const e of zip.getEntries()) {
    if (e.isDirectory) continue;
    if (e.entryName.startsWith('__MACOSX') || e.entryName.split(/[\\/]/).pop()?.startsWith('.')) continue;
    const base = safeBaseName(e.entryName);
    if (!ACCEPTED_EXT.includes(extOf(base))) { skipped += 1; continue; }
    files.push({ name: base, data: e.getData() });
  }
  return { files, skipped };
}

const MIME: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};
export function mimeOf(name: string): string {
  return MIME[extOf(name)] ?? 'application/octet-stream';
}
