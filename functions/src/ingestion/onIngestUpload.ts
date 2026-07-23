import { onObjectFinalized } from 'firebase-functions/v2/storage';
import { getStorage } from 'firebase-admin/storage';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../lib/admin';
import { extractAcceptedFiles, safeBaseName, mimeOf, extOf, type ExtractedFile } from './extract';

interface JobCtx {
  type: 'documents' | 'candidates';
  employeeId?: string;
  positionId?: string;
  departmentId?: string;
  category?: string;
}

/** Dépose un fichier dans le coffre-fort d'un collaborateur (Storage + métadonnée). */
async function ingestDocument(orgId: string, job: JobCtx, f: ExtractedFile, bucketName: string) {
  const path = `documents/${orgId}/${job.employeeId}/${Date.now()}_${safeBaseName(f.name)}`;
  await getStorage().bucket(bucketName).file(path).save(f.data, { contentType: mimeOf(f.name), resumable: false });
  await db.collection('employeeDocuments').add({
    orgId, employeeId: job.employeeId, category: job.category ?? 'autre',
    name: f.name, storagePath: path, uploadedByUid: 'ingestion',
    createdAt: FieldValue.serverTimestamp(),
  });
}

/** Crée un candidat « à qualifier » à partir d'un CV, et archive le fichier. */
async function ingestCandidate(orgId: string, job: JobCtx, f: ExtractedFile, bucketName: string) {
  const ref = db.collection('candidates').doc();
  const cvPath = `hr/${orgId}/candidates/${ref.id}/${safeBaseName(f.name)}`;
  await getStorage().bucket(bucketName).file(cvPath).save(f.data, { contentType: mimeOf(f.name), resumable: false });
  const firstName = safeBaseName(f.name).replace(new RegExp(`\\.${extOf(f.name)}$`, 'i'), '').slice(0, 80) || 'Candidat importé';
  await ref.set({
    orgId, firstName, lastName: '', email: '', source: 'import',
    positionId: job.positionId ?? null, departmentId: job.departmentId ?? null,
    yearsExperience: 0, stage: 'nouveau', tags: ['import', 'à qualifier'], cvPath,
    appliedAt: FieldValue.serverTimestamp(), createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Traite un dépôt sous ingest/{orgId}/{jobId}/… : décompresse (ZIP) ou prend le
 * fichier seul, puis alimente le coffre-fort (documents) ou la Boîte RH (candidats)
 * selon le job. Idempotent : le job n'est traité que s'il est encore « pending »
 * (réclamation transactionnelle). L'archive est supprimée après traitement.
 */
export const onIngestUpload = onObjectFinalized({ memory: '512MiB', timeoutSeconds: 300 }, async (event) => {
  const path = event.data.name;
  if (!path || !path.startsWith('ingest/')) return;
  const parts = path.split('/');
  if (parts.length < 4) return;
  const orgId = parts[1];
  const jobId = parts[2];

  const jobRef = db.doc(`ingestionJobs/${jobId}`);
  const job = await db.runTransaction(async (tx) => {
    const snap = await tx.get(jobRef);
    if (!snap.exists || snap.get('orgId') !== orgId || snap.get('status') !== 'pending') return null;
    tx.update(jobRef, { status: 'processing', updatedAt: FieldValue.serverTimestamp() });
    return snap.data() as JobCtx;
  });
  if (!job) return;

  const bucketName = event.data.bucket;
  try {
    const [buf] = await getStorage().bucket(bucketName).file(path).download();
    const isZip = (event.data.contentType ?? '').includes('zip') || path.toLowerCase().endsWith('.zip');
    const { files, skipped } = isZip
      ? extractAcceptedFiles(buf)
      : { files: [{ name: safeBaseName(path.split('/').pop() ?? 'fichier'), data: buf }], skipped: 0 };

    let processed = 0;
    const errors: string[] = [];
    for (const f of files) {
      try {
        if (job.type === 'documents') await ingestDocument(orgId, job, f, bucketName);
        else await ingestCandidate(orgId, job, f, bucketName);
        processed += 1;
      } catch (e) {
        errors.push(`${f.name}: ${(e as Error).message}`);
      }
    }

    await jobRef.update({
      status: processed === 0 && errors.length > 0 ? 'error' : 'done',
      total: files.length, processed, skipped, errors: errors.slice(0, 50),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (e) {
    await jobRef.update({ status: 'error', errors: [(e as Error).message], updatedAt: FieldValue.serverTimestamp() });
  } finally {
    // On retire l'archive déposée (ne pas conserver de données brutes en zone de transit).
    await getStorage().bucket(bucketName).file(path).delete().catch(() => undefined);
  }
});
