import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../lib/admin';
import { assertRole } from '../lib/rbac';
import { writeAudit } from '../lib/audit';
import { FieldValue } from 'firebase-admin/firestore';

const Schema = z.object({
  employeeId: z.string().min(1),
  departmentId: z.string().min(1),
  bandLevel: z.enum(['junior', 'confirme', 'senior', 'lead', 'manager']),
  baseSalary: z.number().int().min(0),
  currency: z.string().min(1).default('XOF'),
  effectiveDate: z.string().min(1),
  reason: z.string().min(1).max(500),
});

/**
 * Pose ou ajuste la rémunération courante d'un collaborateur (id = employeeId).
 * Donnée personnelle sensible : écriture serveur uniquement, réservée DRH/RH, et
 * chaque changement journalise l'avant/après (montant précédent → nouveau). Audit ARTCI.
 */
export const setCompensation = onCall(async (req) => {
  const c = assertRole(req, ['super_admin', 'drh', 'rh']);
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', p.error.issues[0]?.message ?? 'Rémunération invalide.');
  const { employeeId, reason, ...data } = p.data;

  const ref = db.doc(`compensations/${employeeId}`);
  const previous = await ref.get();
  const prevSalary = previous.exists ? (previous.get('baseSalary') as number) : null;

  await ref.set({
    orgId: c.orgId, employeeId, ...data,
    updatedAt: FieldValue.serverTimestamp(),
    ...(previous.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
  }, { merge: true });

  await writeAudit({
    actor: { uid: req.auth!.uid, claims: c },
    action: prevSalary === null ? 'create_compensation' : 'update_compensation',
    resource: 'compensations', resourceId: employeeId,
    before: { baseSalary: prevSalary },
    after: { baseSalary: data.baseSalary, bandLevel: data.bandLevel, reason },
  });
  return { ok: true, id: employeeId, previous: prevSalary };
});
