import { beforeAll, afterAll, beforeEach, describe, it } from 'vitest';
import { assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { setupEnv, getEnv, as, anon, seed, ORG } from './helpers';

// Prérequis : émulateur Firestore lancé. Utiliser :
//   firebase emulators:exec --only firestore "vitest run tests/firestore.rules.test.ts"

beforeAll(async () => { await setupEnv(); });
afterAll(async () => { await getEnv().cleanup(); });
beforeEach(async () => { await getEnv().clearFirestore(); });

// Acteurs de référence
const drh        = () => as('u_drh',    { role: 'drh' });
const rh         = () => as('u_rh',     { role: 'rh' });
const mgrCyber   = () => as('u_mgr',    { role: 'manager', departmentId: 'cyber', employeeId: 'e_mgr' });
const mgrReseau  = () => as('u_mgr2',   { role: 'manager', departmentId: 'reseau', employeeId: 'e_mgr2' });
const collab     = () => as('u_collab', { role: 'collaborateur', departmentId: 'cyber', employeeId: 'e_collab' });
const lecture    = () => as('u_lect',   { role: 'lecture' });

describe('users — le rôle ne se change pas par écriture directe', () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'users/u_collab'), { orgId: ORG, email: 'c@neurones.ci', role: 'collaborateur' });
    });
  });
  it('collaborateur lit son propre profil', async () => {
    await assertSucceeds(getDoc(doc(collab(), 'users/u_collab')));
  });
  it('collaborateur ne lit pas le profil d’un autre', async () => {
    await assertFails(getDoc(doc(collab(), 'users/u_drh')));
  });
  it('DRH met à jour un profil SANS changer le rôle', async () => {
    await assertSucceeds(updateDoc(doc(drh(), 'users/u_collab'), { email: 'x@neurones.ci' }));
  });
  it('DRH ne peut PAS changer le rôle via écriture directe', async () => {
    await assertFails(updateDoc(doc(drh(), 'users/u_collab'), { role: 'drh' }));
  });
});

describe('employees — portée département / self', () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'employees/e_collab'), { orgId: ORG, departmentId: 'cyber', uid: 'u_collab' });
    });
  });
  it('manager du département lit un employé de son département', async () => {
    await assertSucceeds(getDoc(doc(mgrCyber(), 'employees/e_collab')));
  });
  it('manager d’un AUTRE département ne lit pas', async () => {
    await assertFails(getDoc(doc(mgrReseau(), 'employees/e_collab')));
  });
  it('le collaborateur lit son propre dossier', async () => {
    await assertSucceeds(getDoc(doc(collab(), 'employees/e_collab')));
  });
  it('le collaborateur ne crée pas d’employé', async () => {
    await assertFails(setDoc(doc(collab(), 'employees/e_new'), { orgId: ORG, departmentId: 'cyber' }));
  });
  it('RH crée un employé', async () => {
    await assertSucceeds(setDoc(doc(rh(), 'employees/e_new'), { orgId: ORG, departmentId: 'cyber' }));
  });
});

describe('leaveRequests — dématérialisation & garde de statut', () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'leaveRequests/lr_soumis'), {
        orgId: ORG, employeeId: 'e_collab', departmentId: 'cyber',
        type: 'conges_payes', status: 'soumis', days: 2,
      });
    });
  });
  it('création directe interdite au client (passe par submitLeaveRequest)', async () => {
    // La fonction serveur revalide le solde et réserve le 'pending' en transaction ;
    // aucune création directe n'est autorisée par les règles.
    await assertFails(addDoc(collection(collab(), 'leaveRequests'), {
      orgId: ORG, employeeId: 'e_collab', departmentId: 'cyber',
      type: 'rtt', status: 'soumis', days: 1,
    }));
  });
  it('création directe interdite même à la RH', async () => {
    await assertFails(addDoc(collection(rh(), 'leaveRequests'), {
      orgId: ORG, employeeId: 'e_collab', departmentId: 'cyber',
      type: 'rtt', status: 'soumis', days: 1,
    }));
  });
  it('collaborateur peut annuler sa demande soumise', async () => {
    await assertSucceeds(updateDoc(doc(collab(), 'leaveRequests/lr_soumis'), { status: 'annule' }));
  });
  it('collaborateur ne peut PAS approuver sa demande (réservé à la fonction serveur)', async () => {
    await assertFails(updateDoc(doc(collab(), 'leaveRequests/lr_soumis'), { status: 'approuve' }));
  });
  it('manager du département lit la file de son département', async () => {
    await assertSucceeds(getDoc(doc(mgrCyber(), 'leaveRequests/lr_soumis')));
  });
  it('manager d’un autre département ne lit pas', async () => {
    await assertFails(getDoc(doc(mgrReseau(), 'leaveRequests/lr_soumis')));
  });
});

describe('leaveBalances — écriture serveur uniquement', () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'leaveBalances/e_collab'), {
        orgId: ORG, employeeId: 'e_collab', departmentId: 'cyber',
        entitlements: { conges_payes: 26 }, taken: {}, pending: {},
      });
    });
  });
  it('le collaborateur lit son solde', async () => {
    await assertSucceeds(getDoc(doc(collab(), 'leaveBalances/e_collab')));
  });
  it('personne ne modifie un solde par écriture directe (même DRH)', async () => {
    await assertFails(updateDoc(doc(drh(), 'leaveBalances/e_collab'), { taken: { conges_payes: 5 } }));
  });
});

describe('objectifs — brouillon par le collaborateur', () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'objectives/o1'), {
        orgId: ORG, campaignId: 'c1', employeeId: 'e_collab', departmentId: 'cyber',
        title: 'Certif', weight: 100, status: 'brouillon',
      });
    });
  });
  it('collaborateur crée SON objectif en brouillon', async () => {
    await assertSucceeds(setDoc(doc(collab(), 'objectives/o2'), {
      orgId: ORG, campaignId: 'c1', employeeId: 'e_collab', departmentId: 'cyber',
      title: 'X', weight: 0, status: 'brouillon',
    }));
  });
  it('collaborateur ne s’auto-valide pas un objectif', async () => {
    await assertFails(setDoc(doc(collab(), 'objectives/o3'), {
      orgId: ORG, campaignId: 'c1', employeeId: 'e_collab', departmentId: 'cyber',
      title: 'X', weight: 0, status: 'valide',
    }));
  });
  it('manager du département met à jour un objectif de son équipe', async () => {
    await assertSucceeds(updateDoc(doc(mgrCyber(), 'objectives/o1'), { status: 'valide' }));
  });
  it('le collaborateur ne s’auto-valide pas son objectif existant', async () => {
    await assertFails(updateDoc(doc(collab(), 'objectives/o1'), { status: 'valide' }));
  });
  it('le collaborateur ne réattribue pas son objectif à un autre', async () => {
    await assertFails(updateDoc(doc(collab(), 'objectives/o1'), { employeeId: 'e_autre' }));
  });
});

describe('evaluations — visibilité conditionnée à la publication', () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'evaluations/ev_draft'), {
        orgId: ORG, campaignId: 'c1', employeeId: 'e_collab', departmentId: 'cyber', status: 'soumise',
      });
      await setDoc(doc(db, 'evaluations/ev_pub'), {
        orgId: ORG, campaignId: 'c1', employeeId: 'e_collab', departmentId: 'cyber', status: 'publiee',
      });
    });
  });
  it('le collaborateur lit son évaluation PUBLIÉE', async () => {
    await assertSucceeds(getDoc(doc(collab(), 'evaluations/ev_pub')));
  });
  it('le collaborateur ne lit PAS son évaluation non publiée', async () => {
    await assertFails(getDoc(doc(collab(), 'evaluations/ev_draft')));
  });
  it('le collaborateur ne se publie pas lui-même (status)', async () => {
    await assertFails(updateDoc(doc(collab(), 'evaluations/ev_draft'), { status: 'publiee' }));
  });
});

describe('trainingNeeds — portée manager', () => {
  it('manager du département crée un besoin pour son équipe', async () => {
    await assertSucceeds(setDoc(doc(mgrCyber(), 'trainingNeeds/n1'), {
      orgId: ORG, departmentId: 'cyber', skill: 'Cloud', priority: 'haute', source: 'manager',
    }));
  });
  it('manager d’un autre département ne crée pas un besoin sur « cyber »', async () => {
    await assertFails(setDoc(doc(mgrReseau(), 'trainingNeeds/n2'), {
      orgId: ORG, departmentId: 'cyber', skill: 'Cloud', priority: 'haute', source: 'manager',
    }));
  });
});

describe('auditLogs — lecture DRH, écriture serveur only', () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'auditLogs/a1'), { orgId: ORG, action: 'x', resource: 'y', resourceId: 'z' });
    });
  });
  it('DRH lit les logs d’audit', async () => {
    await assertSucceeds(getDoc(doc(drh(), 'auditLogs/a1')));
  });
  it('RH ne lit PAS les logs d’audit', async () => {
    await assertFails(getDoc(doc(rh(), 'auditLogs/a1')));
  });
  it('aucune écriture client dans auditLogs', async () => {
    await assertFails(setDoc(doc(drh(), 'auditLogs/a2'), { orgId: ORG, action: 'z' }));
  });
});

describe('notifications — chacun les siennes', () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'notifications/n_collab'), { orgId: ORG, toUid: 'u_collab', read: false });
    });
  });
  it('l’utilisateur lit ses notifications', async () => {
    await assertSucceeds(getDoc(doc(collab(), 'notifications/n_collab')));
  });
  it('un autre utilisateur ne les lit pas', async () => {
    await assertFails(getDoc(doc(lecture(), 'notifications/n_collab')));
  });
  it('le destinataire marque sa notification comme lue', async () => {
    await assertSucceeds(updateDoc(doc(collab(), 'notifications/n_collab'), { read: true }));
  });
  it('le destinataire ne peut pas altérer d’autres champs (ex. toUid)', async () => {
    await assertFails(updateDoc(doc(collab(), 'notifications/n_collab'), { toUid: 'u_autre' }));
  });
});

describe('catch-all — refus par défaut', () => {
  it('collection inconnue refusée', async () => {
    await assertFails(getDoc(doc(drh(), 'collectionInconnue/x')));
  });
  it('non authentifié refusé', async () => {
    await assertFails(getDoc(doc(anon(), 'employees/e_collab')));
  });
});
