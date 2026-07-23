import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../lib/admin';
import { assertRole, assertSameOrg } from '../lib/rbac';
import { writeAudit } from '../lib/audit';
import { FieldValue } from 'firebase-admin/firestore';

const Schema = z.object({
  employeeId: z.string().min(1),
  departmentId: z.string().min(1),
  startDate: z.string().min(1),
  notes: z.string().max(1000).optional(),
});

const TASKS = [
  { key: 'poste_travail', label: 'Poste de travail & équipement prêts' },
  { key: 'comptes_si', label: 'Création des comptes SI & accès' },
  { key: 'badge', label: "Badge d'accès remis" },
  { key: 'parrain', label: 'Parrain/marraine désigné(e)' },
  { key: 'dossier_admin', label: 'Dossier administratif complété' },
  { key: 'presentation_equipe', label: "Présentation à l'équipe" },
  { key: 'objectifs_essai', label: "Objectifs de période d'essai fixés" },
  { key: 'point_j30', label: 'Point à 30 jours planifié' },
];

/**
 * Démarre un parcours d'intégration (onboarding) pour un collaborateur
 * (id = onb_<employeeId>). Réservé RH/DRH. Refuse s'il en existe déjà un en cours. Audit.
 */
export const startOnboarding = onCall(async (req) => {
  const c = assertRole(req, ['super_admin', 'drh', 'rh']);
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', p.error.issues[0]?.message ?? 'Données invalides.');
  const { employeeId, ...data } = p.data;

  const emp = await db.doc(`employees/${employeeId}`).get();
  if (!emp.exists) throw new HttpsError('not-found', 'Collaborateur introuvable.');
  assertSameOrg(c, emp.get('orgId'));

  const ref = db.doc(`onboardings/onb_${employeeId}`);
  const existing = await ref.get();
  if (existing.exists && existing.get('status') === 'en_cours') {
    throw new HttpsError('already-exists', 'Une intégration est déjà en cours pour ce collaborateur.');
  }

  await ref.set({
    orgId: c.orgId, employeeId, ...data,
    status: 'en_cours',
    tasks: TASKS.map((t) => ({ ...t, done: false })),
    createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
  });

  await writeAudit({
    actor: { uid: req.auth!.uid, claims: c },
    action: 'start_onboarding', resource: 'onboardings', resourceId: ref.id,
    after: { employeeId, startDate: data.startDate },
  });
  return { ok: true, id: ref.id };
});
