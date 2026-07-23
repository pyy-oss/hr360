import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../lib/admin';
import { assertRole, assertSameOrg } from '../lib/rbac';
import { writeAudit } from '../lib/audit';
import { FieldValue } from 'firebase-admin/firestore';

const Schema = z.object({
  employeeId: z.string().min(1),
  departmentId: z.string().min(1),
  reason: z.enum(['demission', 'licenciement', 'fin_cdd', 'rupture_conventionnelle', 'retraite', 'autre']),
  lastDay: z.string().min(1),
  notes: z.string().max(1000).optional(),
});

const TASKS = [
  { key: 'revocation_acces', label: 'Révocation des accès SI & comptes' },
  { key: 'restitution_materiel', label: 'Restitution du matériel' },
  { key: 'badge', label: "Restitution du badge d'accès" },
  { key: 'passation', label: 'Passation des missions & dossiers' },
  { key: 'entretien_sortie', label: 'Entretien de sortie réalisé' },
  { key: 'solde_tout_compte', label: 'Solde de tout compte' },
  { key: 'documents_fin', label: 'Documents de fin de contrat remis' },
];

/**
 * Démarre un processus d'offboarding pour un collaborateur (id = off_<employeeId>).
 * Réservé RH/DRH. Refuse s'il existe déjà un offboarding en cours. Audit.
 */
export const startOffboarding = onCall(async (req) => {
  const c = assertRole(req, ['super_admin', 'drh', 'rh']);
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', p.error.issues[0]?.message ?? 'Données invalides.');
  const { employeeId, ...data } = p.data;

  // Vérifie que le collaborateur appartient bien à l'organisation.
  const emp = await db.doc(`employees/${employeeId}`).get();
  if (!emp.exists) throw new HttpsError('not-found', 'Collaborateur introuvable.');
  assertSameOrg(c, emp.get('orgId'));

  const ref = db.doc(`offboardings/off_${employeeId}`);
  const existing = await ref.get();
  if (existing.exists && existing.get('status') === 'en_cours') {
    throw new HttpsError('already-exists', 'Un offboarding est déjà en cours pour ce collaborateur.');
  }

  await ref.set({
    orgId: c.orgId, employeeId, ...data,
    status: 'en_cours',
    tasks: TASKS.map((t) => ({ ...t, done: false })),
    createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
  });

  await writeAudit({
    actor: { uid: req.auth!.uid, claims: c },
    action: 'start_offboarding', resource: 'offboardings', resourceId: ref.id,
    after: { employeeId, reason: data.reason, lastDay: data.lastDay },
  });
  return { ok: true, id: ref.id };
});
