import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../lib/admin';
import { getClaims } from '../lib/rbac';
import { writeAudit } from '../lib/audit';
import { FieldValue } from 'firebase-admin/firestore';

const Schema = z.object({
  year: z.number().int().min(2024),
  scope: z.enum(['org', 'dept', 'employee']),
  departmentId: z.string().optional(),
  items: z.array(z.object({
    catalogId: z.string().min(1),
    targetEmployees: z.array(z.string()).default([]),
    budgetIndex: z.number().nonnegative().optional(),
  })).min(1),
});

/**
 * Crée un plan de formation. RH/DRH sur tout périmètre ; un manager uniquement sur
 * un plan de portée 'dept' de SON département. Audit systématique.
 */
export const createTrainingPlan = onCall(async (req) => {
  const c = getClaims(req);
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', 'Plan invalide.');
  const d = p.data;

  const isHR = ['super_admin', 'drh', 'rh'].includes(c.role);
  const isDeptMgr = c.role === 'manager' && d.scope === 'dept' && d.departmentId === c.departmentId;
  if (!isHR && !isDeptMgr) {
    throw new HttpsError('permission-denied', "Réservé à la RH ou au manager de son département.");
  }
  if ((d.scope === 'dept') && !d.departmentId) {
    throw new HttpsError('invalid-argument', 'departmentId requis pour un plan de département.');
  }

  const ref = db.collection('trainingPlans').doc();
  await ref.set({
    orgId: c.orgId, year: d.year, scope: d.scope,
    departmentId: d.departmentId ?? null, items: d.items,
    status: 'actif', createdBy: req.auth!.uid,
    createdAt: FieldValue.serverTimestamp(),
  });

  await writeAudit({
    actor: { uid: req.auth!.uid, claims: c },
    action: 'create_training_plan', resource: 'trainingPlans', resourceId: ref.id,
    after: { year: d.year, scope: d.scope, items: d.items.length },
  });
  return { ok: true, id: ref.id };
});
