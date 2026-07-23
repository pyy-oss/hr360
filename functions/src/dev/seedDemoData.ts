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

  const missions = [
    { id: 'm_audit_bank', name: 'Audit sécurité — banque régionale', client: 'Banque régionale', departmentId: 'cyber', status: 'active', startDate: '2026-08-15' },
    { id: 'm_soc_telco', name: 'Déploiement SOC — télécom', client: 'Opérateur télécom', departmentId: 'infra', status: 'active', startDate: '2026-06-01' },
    { id: 'm_grc_assur', name: 'Conseil GRC — assurance', client: 'Assureur', departmentId: 'conseil', status: 'prospect', startDate: '2026-10-01' },
  ];
  const assignments = [
    { id: 'a_sk', employeeId: 'e_sk', missionId: 'm_soc_telco', departmentId: 'infra', allocationPct: 100, startDate: '2026-06-01', endDate: '2026-12-31', status: 'active' },
    { id: 'a_at', employeeId: 'e_at', missionId: 'm_soc_telco', departmentId: 'infra', allocationPct: 80, startDate: '2026-06-01', endDate: '2026-12-31', status: 'active' },
    { id: 'a_hb', employeeId: 'e_hb', missionId: 'm_audit_bank', departmentId: 'conseil', allocationPct: 50, startDate: '2026-08-15', endDate: '2026-11-30', status: 'active' },
    { id: 'a_ak', employeeId: 'e_ak', missionId: 'm_audit_bank', departmentId: 'cyber', allocationPct: 30, startDate: '2026-08-15', endDate: '2026-11-30', status: 'active' },
  ];

  const trainingCatalog = [
    { id: 'tc_offensive', name: 'Parcours cybersécurité offensive', tag: '6 modules' },
    { id: 'tc_iso', name: 'Conformité & normes ISO', tag: '4 modules' },
    { id: 'tc_conseil', name: 'Posture conseil & relation client', tag: '3 modules' },
    { id: 'tc_leadership', name: 'Leadership de mission', tag: 'Nouveau' },
  ];
  const trainingPlans = [
    { id: 'tp_oscp', name: 'Certification OSCP (2 pers.)', departmentId: 'cyber', progressPct: 60 },
    { id: 'tp_iso', name: 'ISO 27001 Lead Auditor', departmentId: 'conseil', progressPct: 45 },
    { id: 'tp_cloud', name: 'Sécurité cloud Azure', departmentId: 'infra', progressPct: 80 },
    { id: 'tp_posture', name: 'Posture conseil (soft skills)', departmentId: 'cyber', progressPct: 30 },
  ];
  const trainingNeeds = [
    { id: 'tn_cloud', departmentId: 'cyber', skill: 'Sécurité cloud', priority: 'haute', source: 'manager', status: 'planifie' },
    { id: 'tn_siem', departmentId: 'infra', skill: 'Supervision SIEM', priority: 'moyenne', source: 'manager', status: 'planifie' },
  ];

  const positions = [
    { id: 'p_cyber_conf', title: 'Consultant Cybersécurité — Confirmé', departmentId: 'cyber', level: 'confirme', contractType: 'cdi', openings: 2, status: 'ouvert', mustSkills: ["Tests d'intrusion & audit", 'Normes ISO 27001 / EBIOS RM', 'Sécurité réseau & pare-feu'], niceSkills: ['Supervision SIEM', 'Certif. OSCP / CEH / CISSP'], excludedCriteria: ['age', 'genre', 'origine', 'photo'], weights: { technique: 50, experience: 25, soft: 15, formation: 10 } },
    { id: 'p_soc_junior', title: 'Analyste SOC — Junior', departmentId: 'infra', level: 'junior', contractType: 'cdi', openings: 1, status: 'ouvert', mustSkills: ['Supervision SIEM', 'Analyse de logs'], niceSkills: ['Scripting Python'], excludedCriteria: ['age', 'genre'], weights: { technique: 55, experience: 15, soft: 20, formation: 10 } },
  ];
  const candidates = [
    { id: 'c_sg', firstName: 'Salif', lastName: 'Guéï', email: 's.guei@example.ci', source: 'site', positionId: 'p_cyber_conf', departmentId: 'cyber', yearsExperience: 5, stage: 'preselection', matchScore: 84, tags: ['OSCP', 'EBIOS RM'] },
    { id: 'c_nb', firstName: 'Nadège', lastName: 'Brou', email: 'n.brou@example.ci', source: 'spontanee', positionId: 'p_cyber_conf', departmentId: 'cyber', yearsExperience: 4, stage: 'vivier', matchScore: 79, tags: ['ISO 27001'] },
    { id: 'c_od', firstName: 'Omar', lastName: 'Doumbia', email: 'o.doumbia@example.ci', source: 'cabinet', positionId: 'p_cyber_conf', departmentId: 'cyber', yearsExperience: 6, stage: 'entretien', matchScore: 76, tags: ['Audit'] },
    { id: 'c_mk', firstName: 'Mariam', lastName: 'Koffi', email: 'm.koffi@example.ci', source: 'cooptation', positionId: 'p_soc_junior', departmentId: 'infra', yearsExperience: 2, stage: 'nouveau', matchScore: 71, tags: ['SIEM'] },
  ];

  const batch = db.batch();
  for (const d of departments) batch.set(db.doc(`departments/${d.id}`), { orgId, ...d, updatedAt: now }, { merge: true });
  for (const m of missions) batch.set(db.doc(`missions/${m.id}`), { orgId, ...m, updatedAt: now }, { merge: true });
  for (const a of assignments) batch.set(db.doc(`assignments/${a.id}`), { orgId, ...a, updatedAt: now }, { merge: true });
  for (const t of trainingCatalog) batch.set(db.doc(`trainingCatalog/${t.id}`), { orgId, ...t, updatedAt: now }, { merge: true });
  for (const p of trainingPlans) batch.set(db.doc(`trainingPlans/${p.id}`), { orgId, ...p, updatedAt: now }, { merge: true });
  for (const n of trainingNeeds) batch.set(db.doc(`trainingNeeds/${n.id}`), { orgId, ...n, updatedAt: now }, { merge: true });
  for (const e of employees) batch.set(db.doc(`employees/${e.id}`), { orgId, uid: null, ...e, updatedAt: now }, { merge: true });
  for (const b of balances) batch.set(db.doc(`leaveBalances/${b.id}`), { orgId, employeeId: b.id, ...b, updatedAt: now }, { merge: true });
  for (const r of leaveRequests) batch.set(db.doc(`leaveRequests/${r.id}`), { orgId, ...r, currentApproverUid: null, decisions: [], createdAt: now, updatedAt: now }, { merge: true });
  for (const p of positions) batch.set(db.doc(`positions/${p.id}`), { orgId, ...p, createdAt: now, updatedAt: now }, { merge: true });
  for (const cd of candidates) batch.set(db.doc(`candidates/${cd.id}`), { orgId, ...cd, appliedAt: now, createdAt: now, updatedAt: now }, { merge: true });
  await batch.commit();

  await writeAudit({
    actor: { uid: req.auth!.uid, claims: c },
    action: 'seed_demo_data', resource: 'org', resourceId: orgId,
    after: { departments: departments.length, employees: employees.length, leaveRequests: leaveRequests.length },
  });

  return {
    ok: true, departments: departments.length, employees: employees.length,
    balances: balances.length, leaveRequests: leaveRequests.length,
    missions: missions.length, assignments: assignments.length,
    positions: positions.length, candidates: candidates.length,
  };
});
