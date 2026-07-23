import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../lib/admin';
import { assertRole, assertSameOrg } from '../lib/rbac';
import { writeAudit } from '../lib/audit';
import { FieldValue } from 'firebase-admin/firestore';

const Schema = z.object({ campaignId: z.string().min(1) });

/**
 * Ouvre la campagne d'évaluations : crée une évaluation « en_cours » par
 * collaborateur de l'organisation. Idempotent — on lit d'abord les évaluations
 * déjà présentes pour cette campagne et on ne recrée que les manquantes (jamais
 * d'écrasement d'une évaluation déjà avancée). Réservé RH/DRH. Audit.
 */
export const openCampaignEvaluations = onCall(async (req) => {
  const c = assertRole(req, ['super_admin', 'drh', 'rh']);
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', 'Requête invalide.');
  const { campaignId } = p.data;

  const camp = await db.doc(`objectiveCampaigns/${campaignId}`).get();
  if (!camp.exists) throw new HttpsError('not-found', 'Campagne introuvable.');
  assertSameOrg(c, camp.get('orgId'));

  const [emps, existing] = await Promise.all([
    db.collection('employees').where('orgId', '==', c.orgId).limit(500).get(),
    db.collection('evaluations').where('campaignId', '==', campaignId).limit(1000).get(),
  ]);
  const already = new Set(existing.docs.map((d) => d.get('employeeId')));

  const batch = db.batch();
  let created = 0;
  for (const e of emps.docs) {
    if (already.has(e.id)) continue;
    batch.set(db.doc(`evaluations/${campaignId}__${e.id}`), {
      orgId: c.orgId, campaignId, employeeId: e.id,
      departmentId: e.get('departmentId') ?? null,
      status: 'en_cours', selfAssessment: '', managerAssessment: '', rating: null,
      createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
    });
    created += 1;
  }
  if (created > 0) await batch.commit();

  await writeAudit({
    actor: { uid: req.auth!.uid, claims: c },
    action: 'open_campaign_evaluations', resource: 'objectiveCampaigns', resourceId: campaignId,
    after: { created, total: emps.size },
  });
  return { ok: true, created, total: emps.size };
});
