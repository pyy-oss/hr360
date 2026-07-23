import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../lib/admin';
import { assertRole } from '../lib/rbac';
import { writeAudit } from '../lib/audit';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Jeu de données de démonstration (réservé super_admin), pour peupler les écrans
 * branchés au vrai backend. Idempotent : IDs fixes, écritures en merge.
 * Écrit dans l'organisation de l'appelant. À NE PAS utiliser en production réelle.
 */
export const seedDemoData = onCall(async (req) => {
  const c = assertRole(req, ['super_admin']);
  const orgId = c.orgId;
  const now = FieldValue.serverTimestamp();

  const departments = [
    { id: 'cyber', name: 'Cybersécurité & Audit' },
    { id: 'infra', name: 'Infrastructure & Réseaux' },
    { id: 'conseil', name: 'Conseil / AMOA' },
  ];
  const employees = [
    { id: 'e_ak', firstName: 'Aïcha', lastName: 'Koné', departmentId: 'cyber', jobTitle: 'Consultant Cybersécurité', status: 'essai' },
    { id: 'e_sk', firstName: 'Salif', lastName: 'K.', departmentId: 'infra', jobTitle: 'Analyste SOC', status: 'confirme' },
    { id: 'e_at', firstName: 'Aminata', lastName: 'T.', departmentId: 'infra', jobTitle: 'Consultant Réseau', status: 'confirme' },
    { id: 'e_hb', firstName: 'Hervé', lastName: 'B.', departmentId: 'conseil', jobTitle: "Chargé d'audit", status: 'confirme' },
  ];
  const balances = [
    { id: 'e_sk', entitlements: { conges_payes: 26 }, taken: { conges_payes: 14 }, pending: {} },
    { id: 'e_at', entitlements: { conges_payes: 26 }, taken: { conges_payes: 18 }, pending: {} },
    { id: 'e_hb', entitlements: { conges_payes: 26 }, taken: { conges_payes: 8 }, pending: {} },
    { id: 'e_ak', entitlements: { conges_payes: 26 }, taken: {}, pending: {} },
  ];
  const leaveRequests = [
    { id: 'lr_demo_1', employeeId: 'e_at', employeeName: 'Aminata T.', departmentId: 'infra', type: 'conges_payes', days: 5, startDate: '2026-08-03', endDate: '2026-08-07', status: 'soumis' },
    { id: 'lr_demo_2', employeeId: 'e_sk', employeeName: 'Salif K.', departmentId: 'infra', type: 'recuperation', days: 1, startDate: '2026-07-28', endDate: '2026-07-28', status: 'soumis' },
    { id: 'lr_demo_3', employeeId: 'e_hb', employeeName: 'Hervé B.', departmentId: 'conseil', type: 'sans_solde', days: 3, startDate: '2026-09-14', endDate: '2026-09-16', status: 'soumis' },
  ];

  const batch = db.batch();
  for (const d of departments) batch.set(db.doc(`departments/${d.id}`), { orgId, ...d, updatedAt: now }, { merge: true });
  for (const e of employees) batch.set(db.doc(`employees/${e.id}`), { orgId, uid: null, ...e, updatedAt: now }, { merge: true });
  for (const b of balances) batch.set(db.doc(`leaveBalances/${b.id}`), { orgId, employeeId: b.id, ...b, updatedAt: now }, { merge: true });
  for (const r of leaveRequests) batch.set(db.doc(`leaveRequests/${r.id}`), { orgId, ...r, currentApproverUid: null, decisions: [], createdAt: now, updatedAt: now }, { merge: true });
  await batch.commit();

  await writeAudit({
    actor: { uid: req.auth!.uid, claims: c },
    action: 'seed_demo_data', resource: 'org', resourceId: orgId,
    after: { departments: departments.length, employees: employees.length, leaveRequests: leaveRequests.length },
  });

  return { ok: true, departments: departments.length, employees: employees.length, balances: balances.length, leaveRequests: leaveRequests.length };
});
