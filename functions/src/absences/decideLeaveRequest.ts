import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../lib/admin';
import { assertDeptManagerOrHR, assertSameOrg, getClaims } from '../lib/rbac';
import { writeAudit } from '../lib/audit';
import { FieldValue } from 'firebase-admin/firestore';

const Schema = z.object({
  id: z.string().min(1),
  decision: z.enum(['approuve', 'refuse']),
  comment: z.string().max(500).optional(),
});

/**
 * Décision d'une demande de congé (manager du département ou RH/DRH).
 * Transaction : met à jour le statut, ajuste le solde (pending -> taken si approuvé),
 * écrit l'audit. Le client ne peut jamais faire cette écriture directement (règles).
 */
export const decideLeaveRequest = onCall(async (req) => {
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', 'Décision invalide.');
  const { id, decision, comment } = p.data;

  const reqRef = db.doc(`leaveRequests/${id}`);

  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(reqRef);
    if (!snap.exists) throw new HttpsError('not-found', 'Demande introuvable.');
    const data = snap.data()!;
    if (!['soumis', 'valide_manager'].includes(data.status)) {
      throw new HttpsError('failed-precondition', 'Cette demande a déjà été traitée.');
    }
    const claims = getClaims(req);
    // Isolation multi-tenant : la demande doit appartenir à l'organisation de l'acteur.
    assertSameOrg(claims, data.orgId);
    // Ségrégation des tâches : on ne décide jamais de sa propre demande.
    if (claims.employeeId && claims.employeeId === data.employeeId) {
      throw new HttpsError('permission-denied', 'Vous ne pouvez pas décider de votre propre demande.');
    }
    assertDeptManagerOrHR(req, data.departmentId);

    const before = { status: data.status };
    const balRef = db.doc(`leaveBalances/${data.employeeId}`);
    const counted = ['conges_payes', 'rtt'].includes(data.type);

    if (counted) {
      const bal = await tx.get(balRef);
      const entitled = bal.get(`entitlements.${data.type}`) ?? 0;
      const pending = bal.get(`pending.${data.type}`) ?? 0;
      const taken = bal.get(`taken.${data.type}`) ?? 0;
      const patch: Record<string, unknown> = { pending: { [data.type]: Math.max(0, pending - data.days) } };
      if (decision === 'approuve') {
        // Revalidation du solde au moment de l'approbation (défense en profondeur).
        if (taken + data.days > entitled) {
          throw new HttpsError('failed-precondition', 'Solde insuffisant : approbation refusée.');
        }
        patch.taken = { [data.type]: taken + data.days };
      }
      tx.set(balRef, patch, { merge: true });
    }

    tx.update(reqRef, {
      status: decision,
      currentApproverUid: req.auth!.uid,
      decisions: FieldValue.arrayUnion({
        by: req.auth!.uid, role: claims.role, decision, comment: comment ?? null,
        at: new Date().toISOString(),
      }),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { claims, before, employeeId: data.employeeId };
  });

  await writeAudit({
    actor: { uid: req.auth!.uid, claims: result.claims },
    action: `leave_${decision}`, resource: 'leaveRequests', resourceId: id,
    before: result.before, after: { status: decision },
  });

  // Notification au collaborateur (le trigger onLeaveDecision peut aussi s'en charger).
  return { ok: true };
});
