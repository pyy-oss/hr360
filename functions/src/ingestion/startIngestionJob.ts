import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../lib/admin';
import { getClaims, assertSameOrg } from '../lib/rbac';
import { writeAudit } from '../lib/audit';
import { FieldValue } from 'firebase-admin/firestore';

const Schema = z.object({
  type: z.enum(['documents', 'candidates']),
  employeeId: z.string().optional(),
  positionId: z.string().optional(),
  category: z.enum(['bulletin', 'attestation', 'contrat', 'autre']).optional(),
});

/**
 * Ouvre un job d'import en masse et renvoie le préfixe de dépôt Storage. Le client
 * téléverse ensuite une archive ZIP (ou un fichier) sous `ingest/{orgId}/{jobId}/`,
 * ce qui déclenche le traitement serveur (onIngestUpload).
 * - `documents` : coffre-fort d'un collaborateur — réservé RH/DRH.
 * - `candidates` : Boîte RH — réservé RH/DRH/recruteur.
 */
export const startIngestionJob = onCall(async (req) => {
  const c = getClaims(req);
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', p.error.issues[0]?.message ?? 'Données invalides.');

  const job: Record<string, unknown> = {
    orgId: c.orgId, type: p.data.type, status: 'pending',
    total: 0, processed: 0, skipped: 0, errors: [],
    createdByUid: req.auth!.uid, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
  };

  if (p.data.type === 'documents') {
    if (!['super_admin', 'drh', 'rh'].includes(c.role)) throw new HttpsError('permission-denied', 'Réservé à la RH.');
    if (!p.data.employeeId) throw new HttpsError('invalid-argument', 'Collaborateur requis pour un import de documents.');
    const emp = await db.doc(`employees/${p.data.employeeId}`).get();
    if (!emp.exists) throw new HttpsError('not-found', 'Collaborateur introuvable.');
    assertSameOrg(c, emp.get('orgId'));
    job.employeeId = p.data.employeeId;
    job.departmentId = emp.get('departmentId') ?? null;
    job.category = p.data.category ?? 'autre';
  } else {
    if (!['super_admin', 'drh', 'rh', 'recruteur'].includes(c.role)) throw new HttpsError('permission-denied', 'Réservé au recrutement.');
    if (p.data.positionId) {
      const pos = await db.doc(`positions/${p.data.positionId}`).get();
      if (!pos.exists) throw new HttpsError('not-found', 'Poste introuvable.');
      assertSameOrg(c, pos.get('orgId'));
      job.positionId = p.data.positionId;
      job.departmentId = pos.get('departmentId') ?? null;
    }
  }

  const ref = db.collection('ingestionJobs').doc();
  await ref.set(job);
  await writeAudit({
    actor: { uid: req.auth!.uid, claims: c },
    action: 'start_ingestion_job', resource: 'ingestionJobs', resourceId: ref.id,
    after: { type: p.data.type, employeeId: p.data.employeeId ?? null, positionId: p.data.positionId ?? null },
  });
  return { ok: true, jobId: ref.id, uploadPrefix: `ingest/${c.orgId}/${ref.id}/` };
});
