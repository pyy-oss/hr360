import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../lib/admin';
import { assertRole } from '../lib/rbac';
import { writeAudit } from '../lib/audit';
import { FieldValue } from 'firebase-admin/firestore';

const Schema = z.object({
  level: z.enum(['junior', 'confirme', 'senior', 'lead', 'manager']),
  label: z.string().min(1),
  minAmount: z.number().int().min(0),
  midAmount: z.number().int().min(0),
  maxAmount: z.number().int().min(0),
  currency: z.string().min(1).default('XOF'),
}).refine((b) => b.minAmount <= b.midAmount && b.midAmount <= b.maxAmount, {
  message: 'Les montants doivent être ordonnés : min ≤ médian ≤ max.',
});

/** Définit/ajuste une bande salariale (id = palier). Réservé DRH. Audit. */
export const upsertSalaryBand = onCall(async (req) => {
  const c = assertRole(req, ['super_admin', 'drh']);
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', p.error.issues[0]?.message ?? 'Bande invalide.');
  const data = p.data;

  const ref = db.doc(`salaryBands/${data.level}`);
  await ref.set({ orgId: c.orgId, ...data, updatedAt: FieldValue.serverTimestamp() }, { merge: true });

  await writeAudit({
    actor: { uid: req.auth!.uid, claims: c },
    action: 'upsert_salary_band', resource: 'salaryBands', resourceId: data.level,
    after: { level: data.level, min: data.minAmount, max: data.maxAmount },
  });
  return { ok: true, id: data.level };
});
