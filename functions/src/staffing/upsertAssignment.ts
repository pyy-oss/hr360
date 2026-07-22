import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../lib/admin';
import { assertDeptManagerOrHR } from '../lib/rbac';
import { writeAudit } from '../lib/audit';
import { FieldValue } from 'firebase-admin/firestore';

const Schema = z.object({
  id: z.string().optional(),
  missionId: z.string().min(1),
  employeeId: z.string().min(1),
  departmentId: z.string().min(1),
  allocationPct: z.number().int().min(1).max(100),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  status: z.enum(['prevue', 'active', 'terminee']).default('prevue'),
});

const overlaps = (aS: string, aE: string, bS: string, bE: string) =>
  new Date(aS) <= new Date(bE) && new Date(bS) <= new Date(aE);

/**
 * Crée ou met à jour une affectation (manager du département ou RH/DRH).
 * Garde métier : la somme des allocations d'un collaborateur sur des périodes qui se
 * chevauchent ne peut dépasser 100 %. Vérifiée dans une transaction. Audit.
 */
export const upsertAssignment = onCall(async (req) => {
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', 'Affectation invalide.');
  if (new Date(p.data.endDate) < new Date(p.data.startDate)) {
    throw new HttpsError('invalid-argument', 'La date de fin précède la date de début.');
  }
  const c = assertDeptManagerOrHR(req, p.data.departmentId);
  const { id, ...data } = p.data;

  const ref = id ? db.doc(`assignments/${id}`) : db.collection('assignments').doc();

  await db.runTransaction(async (tx) => {
    // Affectations existantes du collaborateur (hors celle en cours d'édition).
    const q = db.collection('assignments')
      .where('employeeId', '==', data.employeeId)
      .where('status', 'in', ['prevue', 'active']);
    const snap = await tx.get(q);

    let overlapSum = 0;
    snap.forEach((d) => {
      if (d.id === ref.id) return;
      const a = d.data();
      if (overlaps(data.startDate, data.endDate, a.startDate, a.endDate)) {
        overlapSum += a.allocationPct ?? 0;
      }
    });
    if (overlapSum + data.allocationPct > 100) {
      throw new HttpsError('failed-precondition',
        `Sur-allocation : ${overlapSum + data.allocationPct}% sur la période (max 100%).`);
    }

    const payload: Record<string, unknown> = { orgId: c.orgId, ...data, updatedAt: FieldValue.serverTimestamp() };
    if (!id) payload.createdAt = FieldValue.serverTimestamp();
    tx.set(ref, payload, { merge: true });
  });

  await writeAudit({
    actor: { uid: req.auth!.uid, claims: c },
    action: id ? 'update_assignment' : 'create_assignment', resource: 'assignments', resourceId: ref.id,
    after: { employeeId: data.employeeId, missionId: data.missionId, allocationPct: data.allocationPct },
  });
  return { ok: true, id: ref.id };
});
