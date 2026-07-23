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

  const campaigns = [
    { id: 'camp_2026', name: 'Campagne annuelle 2026', year: 2026, phase: 'evaluation' },
  ];
  const objectives = [
    { id: 'obj_ak_1', campaignId: 'camp_2026', employeeId: 'e_ak', departmentId: 'cyber', title: "Réduire le délai moyen d'audit", measure: 'Délai ≤ 15 j ouvrés', weight: 40, status: 'brouillon' },
    { id: 'obj_ak_2', campaignId: 'camp_2026', employeeId: 'e_ak', departmentId: 'cyber', title: 'Obtenir la certification OSCP', measure: 'Certification validée', weight: 60, status: 'valide' },
    { id: 'obj_sk_1', campaignId: 'camp_2026', employeeId: 'e_sk', departmentId: 'infra', title: 'Industrialiser la supervision SIEM', measure: '3 playbooks livrés', weight: 100, status: 'valide' },
  ];
  const evaluations = [
    { id: 'camp_2026__e_ak', campaignId: 'camp_2026', employeeId: 'e_ak', departmentId: 'cyber', status: 'en_cours', selfAssessment: 'Bonne montée en compétence, délais tenus sur 2 audits.', managerAssessment: '', rating: null },
    { id: 'camp_2026__e_sk', campaignId: 'camp_2026', employeeId: 'e_sk', departmentId: 'infra', status: 'soumise', selfAssessment: 'Playbooks SIEM livrés.', managerAssessment: 'Excellent travail d’industrialisation, à confirmer sur la durée.', rating: 4 },
    { id: 'camp_2026__e_hb', campaignId: 'camp_2026', employeeId: 'e_hb', departmentId: 'conseil', status: 'publiee', selfAssessment: 'Mission GRC livrée avec satisfaction client.', managerAssessment: 'Posture conseil solide, COMEX client très satisfait.', rating: 5 },
  ];

  const salaryBands = [
    { id: 'junior', level: 'junior', label: 'Palier 1 — Junior', minAmount: 4800000, midAmount: 6000000, maxAmount: 7200000, currency: 'XOF' },
    { id: 'confirme', level: 'confirme', label: 'Palier 2 — Confirmé', minAmount: 7200000, midAmount: 9000000, maxAmount: 10800000, currency: 'XOF' },
    { id: 'senior', level: 'senior', label: 'Palier 3 — Senior', minAmount: 10800000, midAmount: 13500000, maxAmount: 16200000, currency: 'XOF' },
    { id: 'lead', level: 'lead', label: 'Palier 4 — Lead / Manager', minAmount: 16200000, midAmount: 20000000, maxAmount: 24000000, currency: 'XOF' },
  ];
  const compensations = [
    { id: 'e_sk', employeeId: 'e_sk', departmentId: 'infra', bandLevel: 'confirme', baseSalary: 9200000, currency: 'XOF', effectiveDate: '2026-01-01' },
    { id: 'e_at', employeeId: 'e_at', departmentId: 'infra', bandLevel: 'confirme', baseSalary: 8800000, currency: 'XOF', effectiveDate: '2026-01-01' },
    { id: 'e_hb', employeeId: 'e_hb', departmentId: 'conseil', bandLevel: 'senior', baseSalary: 13000000, currency: 'XOF', effectiveDate: '2026-01-01' },
    { id: 'e_ak', employeeId: 'e_ak', departmentId: 'cyber', bandLevel: 'junior', baseSalary: 6300000, currency: 'XOF', effectiveDate: '2026-06-01' },
  ];

  const offboardings = [
    {
      id: 'off_e_at', employeeId: 'e_at', departmentId: 'infra', reason: 'demission',
      lastDay: '2026-09-30', status: 'en_cours',
      tasks: [
        { key: 'revocation_acces', label: 'Révocation des accès SI & comptes', done: false },
        { key: 'restitution_materiel', label: 'Restitution du matériel', done: true },
        { key: 'badge', label: "Restitution du badge d'accès", done: false },
        { key: 'passation', label: 'Passation des missions & dossiers', done: true },
        { key: 'entretien_sortie', label: 'Entretien de sortie réalisé', done: false },
        { key: 'solde_tout_compte', label: 'Solde de tout compte', done: false },
        { key: 'documents_fin', label: 'Documents de fin de contrat remis', done: false },
      ],
    },
  ];

  const onboardings = [
    {
      id: 'onb_e_ak', employeeId: 'e_ak', departmentId: 'cyber',
      startDate: '2026-07-01', status: 'en_cours',
      tasks: [
        { key: 'poste_travail', label: 'Poste de travail & équipement prêts', done: true },
        { key: 'comptes_si', label: 'Création des comptes SI & accès', done: true },
        { key: 'badge', label: "Badge d'accès remis", done: true },
        { key: 'parrain', label: 'Parrain/marraine désigné(e)', done: true },
        { key: 'dossier_admin', label: 'Dossier administratif complété', done: false },
        { key: 'presentation_equipe', label: "Présentation à l'équipe", done: true },
        { key: 'objectifs_essai', label: "Objectifs de période d'essai fixés", done: false },
        { key: 'point_j30', label: 'Point à 30 jours planifié', done: false },
      ],
    },
  ];

  const interviews = [
    { id: 'itw_od', candidateId: 'c_od', positionId: 'p_cyber_conf', departmentId: 'cyber', scheduledAt: '2026-07-28T10:00', mode: 'visio', interviewers: ['Manager Cyber', 'RH'], notes: 'Entretien technique.', status: 'planifie' },
    { id: 'itw_sg', candidateId: 'c_sg', positionId: 'p_cyber_conf', departmentId: 'cyber', scheduledAt: '2026-07-30T14:30', mode: 'present', interviewers: ['DRH'], notes: '', status: 'planifie' },
  ];

  // Historique d'instantanés (tendances) — 6 points mensuels de démonstration.
  const metricSnapshots = [
    { id: 'snap_1', day: '2026-02-01', headcount: 18, essai: 3, confirme: 15, sortant: 0, openPositions: 4, departuresInProgress: 0, pendingLeave: 2, activeCandidates: 21 },
    { id: 'snap_2', day: '2026-03-01', headcount: 19, essai: 2, confirme: 17, sortant: 0, openPositions: 5, departuresInProgress: 1, pendingLeave: 3, activeCandidates: 28 },
    { id: 'snap_3', day: '2026-04-01', headcount: 21, essai: 3, confirme: 18, sortant: 0, openPositions: 6, departuresInProgress: 0, pendingLeave: 1, activeCandidates: 24 },
    { id: 'snap_4', day: '2026-05-01', headcount: 22, essai: 2, confirme: 20, sortant: 0, openPositions: 5, departuresInProgress: 1, pendingLeave: 4, activeCandidates: 19 },
    { id: 'snap_5', day: '2026-06-01', headcount: 23, essai: 4, confirme: 19, sortant: 0, openPositions: 7, departuresInProgress: 1, pendingLeave: 2, activeCandidates: 31 },
    { id: 'snap_6', day: '2026-07-01', headcount: 24, essai: 3, confirme: 20, sortant: 1, openPositions: 6, departuresInProgress: 1, pendingLeave: 3, activeCandidates: 26 },
  ];

  const pulseQuestions = [
    { key: 'sens', label: 'Sens & fierté' },
    { key: 'management', label: 'Management de proximité' },
    { key: 'charge', label: 'Charge de travail' },
    { key: 'perspectives', label: "Perspectives d'évolution" },
  ];
  const engagementSurveys = [
    { id: 'srv_2026t3', title: 'Enquête pulse — T3 2026', status: 'ouverte', questions: pulseQuestions },
  ];
  // Réponses anonymes de démonstration (aucune identité — cohérent avec le module).
  const engagementResponses = [
    { id: 'er_1', surveyId: 'srv_2026t3', scores: { sens: 5, management: 4, charge: 3, perspectives: 4 } },
    { id: 'er_2', surveyId: 'srv_2026t3', scores: { sens: 4, management: 4, charge: 2, perspectives: 3 } },
    { id: 'er_3', surveyId: 'srv_2026t3', scores: { sens: 5, management: 3, charge: 3, perspectives: 4 } },
    { id: 'er_4', surveyId: 'srv_2026t3', scores: { sens: 4, management: 5, charge: 4, perspectives: 3 } },
  ];

  const knowledgeDocs = [
    { id: 'kd_conges', title: 'Procédure de validation des congés', category: 'procedure', content: "Toute demande de congé se fait via l'application. En dessous de 10 jours ouvrés consécutifs, la validation du manager suffit. Au-delà de 10 jours ouvrés consécutifs, la demande requiert la validation du manager ET de la DRH, avec un préavis minimum de 15 jours. Les congés payés s'acquièrent à raison de 26 jours ouvrés par an. Un solde négatif n'est jamais autorisé." },
    { id: 'kd_teletravail', title: 'Note RH 2026-03 — Télétravail', category: 'note_rh', content: 'Le télétravail est possible jusqu\'à 2 jours par semaine pour les postes éligibles, sur accord du manager. Les jours de présence obligatoire sont le mardi et le jeudi pour favoriser la collaboration. Le matériel est fourni par Neurones ; sa restitution est requise en cas de départ.' },
    { id: 'kd_preavis', title: 'Règlement intérieur — Préavis', category: 'reglement', content: "La durée de préavis en cas de départ dépend de la catégorie et de l'ancienneté, conformément à la convention collective applicable. Pour un cadre en CDI, le préavis usuel est de 3 mois. Toute situation particulière doit être confirmée par la DRH et le juriste avant application." },
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
  for (const cp of campaigns) batch.set(db.doc(`objectiveCampaigns/${cp.id}`), { orgId, ...cp, createdAt: now, updatedAt: now }, { merge: true });
  for (const o of objectives) batch.set(db.doc(`objectives/${o.id}`), { orgId, ...o, createdAt: now, updatedAt: now }, { merge: true });
  for (const ev of evaluations) batch.set(db.doc(`evaluations/${ev.id}`), { orgId, ...ev, createdAt: now, updatedAt: now }, { merge: true });
  for (const sb of salaryBands) batch.set(db.doc(`salaryBands/${sb.id}`), { orgId, ...sb, updatedAt: now }, { merge: true });
  for (const cp of compensations) batch.set(db.doc(`compensations/${cp.id}`), { orgId, ...cp, updatedAt: now }, { merge: true });
  for (const ob of offboardings) batch.set(db.doc(`offboardings/${ob.id}`), { orgId, ...ob, createdAt: now, updatedAt: now }, { merge: true });
  for (const on of onboardings) batch.set(db.doc(`onboardings/${on.id}`), { orgId, ...on, createdAt: now, updatedAt: now }, { merge: true });
  for (const sn of metricSnapshots) batch.set(db.doc(`metricSnapshots/${orgId}_${sn.day}`), { orgId, ...sn, capturedAt: now }, { merge: true });
  for (const it of interviews) batch.set(db.doc(`interviews/${it.id}`), { orgId, ...it, createdAt: now, updatedAt: now }, { merge: true });
  for (const sv of engagementSurveys) batch.set(db.doc(`engagementSurveys/${sv.id}`), { orgId, ...sv, createdAt: now, updatedAt: now }, { merge: true });
  for (const er of engagementResponses) batch.set(db.doc(`engagementResponses/${er.id}`), { orgId, ...er, submittedAt: now }, { merge: true });
  for (const kd of knowledgeDocs) batch.set(db.doc(`knowledgeDocs/${kd.id}`), { orgId, ...kd, createdAt: now, updatedAt: now }, { merge: true });
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
    campaigns: campaigns.length, objectives: objectives.length,
    evaluations: evaluations.length,
    salaryBands: salaryBands.length, compensations: compensations.length,
    offboardings: offboardings.length, onboardings: onboardings.length,
    metricSnapshots: metricSnapshots.length, interviews: interviews.length,
    engagementSurveys: engagementSurveys.length, engagementResponses: engagementResponses.length,
    knowledgeDocs: knowledgeDocs.length,
  };
});
