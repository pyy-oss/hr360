import { setGlobalOptions } from 'firebase-functions/v2';

// Région + max instances (perf : évite le cold start sur les fonctions critiques).
setGlobalOptions({ region: 'europe-west1', maxInstances: 40 });

// Auth / RBAC
export { setUserRole } from './auth/setUserRole';

// Démo / amorçage de données (réservé super_admin)
export { seedDemoData } from './dev/seedDemoData';

// Collaborateurs & départements
export { upsertEmployee } from './collaborateurs/upsertEmployee';
export { upsertDepartment } from './collaborateurs/upsertDepartment';
export { linkEmployeeAccount } from './collaborateurs/linkEmployeeAccount';

// Absences & congés
export { submitLeaveRequest } from './absences/submitLeaveRequest';
export { decideLeaveRequest } from './absences/decideLeaveRequest';
export { onLeaveDecision } from './absences/onLeaveDecision';

// Formation
export { createTrainingPlan } from './formation/createTrainingPlan';
export { updateEnrollment } from './formation/updateEnrollment';
export { closeTrainingNeed } from './formation/closeTrainingNeed';

// Staffing & plan de charge
export { upsertMission } from './staffing/upsertMission';
export { upsertAssignment } from './staffing/upsertAssignment';

// Objectifs & évaluations
export { advanceCampaignPhase } from './objectifs/advanceCampaignPhase';
export { publishEvaluation } from './objectifs/publishEvaluation';
export { validateObjective } from './objectifs/validateObjective';
