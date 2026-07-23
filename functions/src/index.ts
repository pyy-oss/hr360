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
export { onLeaveSubmitted } from './absences/onLeaveSubmitted';

// Formation
export { createTrainingPlan } from './formation/createTrainingPlan';
export { updateEnrollment } from './formation/updateEnrollment';
export { closeTrainingNeed } from './formation/closeTrainingNeed';

// Staffing & plan de charge
export { upsertMission } from './staffing/upsertMission';
export { upsertAssignment } from './staffing/upsertAssignment';

// Recrutement (postes & candidats — sans IA)
export { upsertPosition } from './recrutement/upsertPosition';
export { upsertCandidate } from './recrutement/upsertCandidate';
export { advanceCandidateStage } from './recrutement/advanceCandidateStage';

// Rémunération (données sensibles — écriture serveur uniquement)
export { upsertSalaryBand } from './remuneration/upsertSalaryBand';
export { setCompensation } from './remuneration/setCompensation';

// Offboarding (processus de départ)
export { startOffboarding } from './offboarding/startOffboarding';
export { updateOffboardingTask } from './offboarding/updateOffboardingTask';
export { closeOffboarding } from './offboarding/closeOffboarding';

// Entretiens (planification recrutement)
export { scheduleInterview } from './recrutement/scheduleInterview';
export { updateInterview } from './recrutement/updateInterview';

// Coffre-fort documentaire du collaborateur
export { registerEmployeeDocument } from './documents/registerEmployeeDocument';
export { deleteEmployeeDocument } from './documents/deleteEmployeeDocument';

// Import en masse (ZIP décompressé côté serveur → coffre-fort ou Boîte RH)
export { startIngestionJob } from './ingestion/startIngestionJob';
export { onIngestUpload } from './ingestion/onIngestUpload';

// Métriques (instantanés datés pour les tendances)
export { captureMetricsSnapshot } from './metrics/captureMetricsSnapshot';

// Onboarding & période d'essai (intégration)
export { startOnboarding } from './onboarding/startOnboarding';
export { updateOnboardingTask } from './onboarding/updateOnboardingTask';
export { closeOnboarding } from './onboarding/closeOnboarding';
export { decideProbation } from './onboarding/decideProbation';

// Engagement (enquêtes pulse anonymes)
export { createEngagementSurvey } from './engagement/createEngagementSurvey';
export { closeEngagementSurvey } from './engagement/closeEngagementSurvey';
export { submitEngagementResponse } from './engagement/submitEngagementResponse';
export { getEngagementResults } from './engagement/getEngagementResults';

// Couche IA (appels Claude côté serveur — clé en secret, chaque appel audité)
export { aiAssistant } from './ai/aiAssistant';
export { scoreCandidate } from './ai/scoreCandidate';
export { generateContent } from './ai/generateContent';
export { predictAttrition } from './ai/predictAttrition';
export { askKnowledge } from './ai/askKnowledge';
export { analyzeSkills } from './ai/analyzeSkills';

// Base de connaissances RH (sources du RAG)
export { upsertKnowledgeDoc } from './knowledge/upsertKnowledgeDoc';

// Objectifs & évaluations
export { createObjectiveCampaign } from './objectifs/createObjectiveCampaign';
export { upsertObjective } from './objectifs/upsertObjective';
export { advanceCampaignPhase } from './objectifs/advanceCampaignPhase';
export { openCampaignEvaluations } from './objectifs/openCampaignEvaluations';
export { submitEvaluation } from './objectifs/submitEvaluation';
export { publishEvaluation } from './objectifs/publishEvaluation';
export { validateObjective } from './objectifs/validateObjective';
