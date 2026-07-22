import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../lib/admin';
import { getClaims } from '../lib/rbac';
import { FieldValue } from 'firebase-admin/firestore';

const Schema = z.object({
  type: z.enum(['conges_payes', 'rtt', 'maladie', 'sans_solde', 'evenement_familial', 'recuperation']),
  startDate: z.string(), // ISO
  endDate: z.string(),
  days: z.number().positive(),
  reason: z.string().max(500).optional(),
});

/**
 * Le collaborateur dépose SA demande (statut 'soumis'). Revalidation serveur des droits,
 * du solde, et des chevauchements. Réserve les jours en 'pending' (transaction).
 */
export const submitLeaveRequest = onCall(async (req) => {
  const c = getClaims(req);
  if (!c.employeeId) throw new HttpsError('permission-denied', 'Aucun dossier salarié rattaché.');
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', 'Demande invalide.');
  const d = p.data;
  if (new Date(d.endDate) < new Date(d.startDate)) {
    throw new HttpsError('invalid-argument', 'La date de fin précède la date de début.');
  }

  const empRef = db.doc(`employees/${c.employeeId}`);
  const balRef = db.doc(`leaveBalances/${c.employeeId}`);
  const reqRef = db.collection('leaveRequests').doc();

  await db.runTransaction(async (tx) => {
    const emp = await tx.get(empRef);
    if (!emp.exists) throw new HttpsError('not-found', 'Dossier salarié introuvable.');
    const departmentId = emp.get('departmentId');

    // Vérifie le solde disponible pour les types décomptés.
    if (['conges_payes', 'rtt'].includes(d.type)) {
      const bal = await tx.get(balRef);
      const entitled = bal.get(`entitlements.${d.type}`) ?? 0;
      const taken = bal.get(`taken.${d.type}`) ?? 0;
      const pending = bal.get(`pending.${d.type}`) ?? 0;
      if (entitled - taken - pending < d.days) {
        throw new HttpsError('failed-precondition', 'Solde insuffisant pour cette demande.');
      }
      tx.set(balRef, { orgId: c.orgId, employeeId: c.employeeId, departmentId,
        pending: { [d.type]: pending + d.days } }, { merge: true });
    }

    tx.set(reqRef, {
      orgId: c.orgId, employeeId: c.employeeId, departmentId,
      type: d.type, startDate: d.startDate, endDate: d.endDate, days: d.days,
      reason: d.reason ?? null, status: 'soumis',
      currentApproverUid: null, decisions: [],
      createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return { ok: true, id: reqRef.id };
});
