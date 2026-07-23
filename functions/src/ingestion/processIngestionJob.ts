import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { getStorage } from 'firebase-admin/storage';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../lib/admin';
import { getClaims, assertSameOrg, type Claims } from '../lib/rbac';
import { extractAcceptedFiles, safeBaseName, mimeOf, extOf, type ExtractedFile } from './extract';

const Schema = z.object({
  jobId: z.string().min(1),
  storagePath: z.string().min(1).max(500),
});

interface JobCtx {
  type: 'documents' | 'candidates';
  employeeId?: string;
  positionId?: string;
  departmentId?: string;
  category?: string;
}

/** Dépose un fichier dans le coffre-fort d'un collaborateur (Storage + métadonnée). */
async function ingestDocument(orgId: string, job: JobCtx, f: ExtractedFile) {
  const path = `documents/${orgId}/${job.employeeId}/${Date.now()}_${safeBaseName(f.name)}`;
  await getStorage().bucket().file(path).save(f.data, { contentType: mimeOf(f.name), resumable: false });
  await db.collection('employeeDocuments').add({
    orgId, employeeId: job.employeeId, category: job.category ?? 'autre',
    name: f.name, storagePath: path, uploadedByUid: 'ingestion',
    createdAt: FieldValue.serverTimestamp(),
  });
}

/** Crée un candidat « à qualifier » à partir d'un CV, et archive le fichier. */
async function ingestCandidate(orgId: string, job: JobCtx, f: ExtractedFile) {
  const ref = db.collection('candidates').doc();
  const cvPath = `hr/${orgId}/candidates/${ref.id}/${safeBaseName(f.name)}`;
  await getStorage().bucket().file(cvPath).save(f.data, { contentType: mimeOf(f.name), resumable: false });
  const firstName = safeBaseName(f.name).replace(new RegExp(`\\.${extOf(f.name)}$`, 'i'), '').slice(0, 80) || 'Candidat importé';
  await ref.set({
    orgId, firstName, lastName: '', email: '', source: 'import',
    positionId: job.positionId ?? null, departmentId: job.departmentId ?? null,
    yearsExperience: 0, stage: 'nouveau', tags: ['import', 'à qualifier'], cvPath,
    appliedAt: FieldValue.serverTimestamp(), createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
  });
}

function assertJobAccess(c: Claims, job: JobCtx) {
  const allowed = job.type === 'documents'
    ? ['super_admin', 'drh', 'rh']
    : ['super_admin', 'drh', 'rh', 'recruteur'];
  if (!allowed.includes(c.role)) throw new HttpsError('permission-denied', 'Droits insuffisants pour cet import.');
}

/**
 * Traite un import : le client appelle cette fonction juste après avoir déposé le
 * fichier sous ingest/{orgId}/{jobId}/… . Décompresse (ZIP) ou prend le fichier seul,
 * puis alimente le coffre-fort (documents) ou la Boîte RH (candidats). Idempotent : le
 * job n'est traité que s'il est encore « pending » (réclamation transactionnelle).
 * L'archive est supprimée après traitement. (Fonction appelable — pas de trigger, donc
 * aucune dépendance Eventarc/pubsub au déploiement.)
 */
export const processIngestionJob = onCall({ memory: '512MiB', timeoutSeconds: 300 }, async (req) => {
  const c = getClaims(req);
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', 'Requête invalide.');

  const prefix = `ingest/${c.orgId}/${p.data.jobId}/`;
  if (!p.data.storagePath.startsWith(prefix)) throw new HttpsError('failed-precondition', 'Chemin de dépôt invalide.');

  const jobRef = db.doc(`ingestionJobs/${p.data.jobId}`);
  const job = await db.runTransaction(async (tx) => {
    const snap = await tx.get(jobRef);
    if (!snap.exists) throw new HttpsError('not-found', 'Import introuvable.');
    if (snap.get('orgId') !== c.orgId) throw new HttpsError('permission-denied', 'Import hors organisation.');
    if (snap.get('status') !== 'pending') return null; // déjà traité (idempotent)
    tx.update(jobRef, { status: 'processing', updatedAt: FieldValue.serverTimestamp() });
    return snap.data() as JobCtx;
  });
  if (!job) return { ok: true, alreadyProcessed: true };
  assertJobAccess(c, job);

  const file = getStorage().bucket().file(p.data.storagePath);
  try {
    const [meta] = await file.getMetadata().catch(() => [{ contentType: '' }] as const);
    const [buf] = await file.download();
    const isZip = (meta.contentType ?? '').includes('zip') || p.data.storagePath.toLowerCase().endsWith('.zip');
    const { files, skipped } = isZip
      ? extractAcceptedFiles(buf)
      : { files: [{ name: safeBaseName(p.data.storagePath.split('/').pop() ?? 'fichier'), data: buf }], skipped: 0 };

    let processed = 0;
    const errors: string[] = [];
    for (const f of files) {
      try {
        if (job.type === 'documents') await ingestDocument(c.orgId, job, f);
        else await ingestCandidate(c.orgId, job, f);
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
    return { ok: true, total: files.length, processed, skipped, errors: errors.slice(0, 50) };
  } catch (e) {
    await jobRef.update({ status: 'error', errors: [(e as Error).message], updatedAt: FieldValue.serverTimestamp() });
    throw new HttpsError('internal', "Le traitement de l'import a échoué.");
  } finally {
    await file.delete().catch(() => undefined);
  }
});
