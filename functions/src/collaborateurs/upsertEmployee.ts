import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../lib/admin';
import { assertRole } from '../lib/rbac';
import { writeAudit } from '../lib/audit';
import { FieldValue } from 'firebase-admin/firestore';

const Base = {
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  departmentId: z.string().min(1),
  jobTitle: z.string().min(1),
  seniorityLevel: z.enum(['junior', 'confirme', 'senior', 'lead', 'manager']),
  contractType: z.enum(['cdi', 'cdd', 'stage', 'alternance', 'prestation']),
  hireDate: z.string().min(1),
  managerUid: z.string().optional(),
  status: z.enum(['essai', 'confirme', 'sortant']).default('essai'),
};
const CreateSchema = z.object(Base);
const UpdateSchema = z.object(Base).partial().extend({ id: z.string().min(1) });

/**
 * Crée ou met à jour un dossier collaborateur. Réservé RH/DRH.
 * Vérifie l'existence du département. Audit systématique (avant/après).
 */
export const upsertEmployee = onCall(async (req) => {
  const c = assertRole(req, ['super_admin', 'drh', 'rh']);
  const isUpdate = typeof (req.data ?? {}).id === 'string';

  if (isUpdate) {
    const p = UpdateSchema.safeParse(req.data);
    if (!p.success) throw new HttpsError('invalid-argument', 'Dossier invalide.');
    const { id, ...patch } = p.data;
    const ref = db.doc(`employees/${id}`);
    const before = await ref.get();
    if (!before.exists) throw new HttpsError('not-found', 'Collaborateur introuvable.');
    if (patch.departmentId) await assertDepartmentExists(patch.departmentId);

    await ref.update({ ...patch, updatedAt: FieldValue.serverTimestamp() });
    await writeAudit({
      actor: { uid: req.auth!.uid, claims: c },
      action: 'update_employee', resource: 'employees', resourceId: id,
      before: before.data(), after: patch,
    });
    return { ok: true, id };
  }

  const p = CreateSchema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', 'Dossier invalide.');
  await assertDepartmentExists(p.data.departmentId);

  const ref = db.collection('employees').doc();
  await ref.set({
    orgId: c.orgId, uid: null, ...p.data,
    createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
  });
  await writeAudit({
    actor: { uid: req.auth!.uid, claims: c },
    action: 'create_employee', resource: 'employees', resourceId: ref.id, after: p.data,
  });
  return { ok: true, id: ref.id };
});

async function assertDepartmentExists(departmentId: string) {
  const dep = await db.doc(`departments/${departmentId}`).get();
  if (!dep.exists) throw new HttpsError('failed-precondition', 'Département inexistant.');
}
