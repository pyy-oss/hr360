import { Routes, Route } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';
import { LoginPage } from '@/auth/LoginPage';
import { AppShell } from '@/components/AppShell';
import { DashboardPage } from '@/modules/dashboard/DashboardPage';
import { BoiteRhPage } from '@/modules/recrutement/BoiteRhPage';
import { VivierPage } from '@/modules/recrutement/VivierPage';
import { ScoringPage } from '@/modules/recrutement/ScoringPage';
import { ProfilPage } from '@/modules/recrutement/ProfilPage';
import { DecisionPage } from '@/modules/recrutement/DecisionPage';
import { SupportsPage } from '@/modules/recrutement/SupportsPage';
import { MobilitePage } from '@/modules/recrutement/MobilitePage';
import { PilotagePage } from '@/modules/recrutement/PilotagePage';
import { AssistantPage } from '@/modules/ia/AssistantPage';
import { AnalyticsPage } from '@/modules/rh/AnalyticsPage';
import { CollaborateursPage } from '@/modules/rh/CollaborateursPage';
import { PerformancePage } from '@/modules/rh/PerformancePage';
import { CompetencesPage } from '@/modules/rh/CompetencesPage';
import { FormationPage } from '@/modules/rh/FormationPage';
import { StaffingPage } from '@/modules/rh/StaffingPage';
import { AbsencesPage } from '@/modules/rh/AbsencesPage';
import { ContratPage } from '@/modules/integration/ContratPage';
import { OnboardingPage } from '@/modules/integration/OnboardingPage';
import { EssaiPage } from '@/modules/integration/EssaiPage';
import { EquitePage } from '@/modules/conformite/EquitePage';
import { PostesPage } from '@/modules/conformite/PostesPage';
import { RemunerationPage } from '@/modules/rh/RemunerationPage';
import { EngagementPage } from '@/modules/rh/EngagementPage';
import { OffboardingPage } from '@/modules/rh/OffboardingPage';
import { AgentPage } from '@/modules/ia/AgentPage';
import { PredictionPage } from '@/modules/ia/PredictionPage';
import { WorkforcePage } from '@/modules/ia/WorkforcePage';
import { SkillsAiPage } from '@/modules/ia/SkillsAiPage';
import { StudioPage } from '@/modules/ia/StudioPage';
import { KnowledgePage } from '@/modules/ia/KnowledgePage';
import { GouvernanceIaPage } from '@/modules/ia/GouvernanceIaPage';
import { InterviewsPage } from '@/modules/recrutement/InterviewsPage';
import { DocumentsPage } from '@/modules/documents/DocumentsPage';
import { Placeholder } from '@/components/Placeholder';
import { NAV } from '@/components/nav';

export function App() {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-sm text-slate-500">Chargement…</div>;
  if (!user) return <LoginPage />;

  // Écrans reproduits ; les autres routes de la maquette rendent un placeholder stylé.
  const built: Record<string, JSX.Element> = {
    '/': <DashboardPage />,
    '/boite-rh': <BoiteRhPage />,
    '/vivier': <VivierPage />,
    '/scoring': <ScoringPage />,
    '/profil': <ProfilPage />,
    '/decision': <DecisionPage />,
    '/supports': <SupportsPage />,
    '/mobilite': <MobilitePage />,
    '/pilotage': <PilotagePage />,
    '/assistant': <AssistantPage />,
    '/analytics': <AnalyticsPage />,
    '/collaborateurs': <CollaborateursPage />,
    '/performance': <PerformancePage />,
    '/competences': <CompetencesPage />,
    '/formation': <FormationPage />,
    '/staffing': <StaffingPage />,
    '/absences': <AbsencesPage />,
    '/contrat': <ContratPage />,
    '/onboarding': <OnboardingPage />,
    '/essai': <EssaiPage />,
    '/equite': <EquitePage />,
    '/postes': <PostesPage />,
    '/remuneration': <RemunerationPage />,
    '/engagement': <EngagementPage />,
    '/offboarding': <OffboardingPage />,
    '/agent': <AgentPage />,
    '/prediction': <PredictionPage />,
    '/workforce': <WorkforcePage />,
    '/skills-ai': <SkillsAiPage />,
    '/studio': <StudioPage />,
    '/knowledge': <KnowledgePage />,
    '/gouvernance-ia': <GouvernanceIaPage />,
    '/entretiens': <InterviewsPage />,
    '/documents': <DocumentsPage />,
  };

  return (
    <AppShell>
      <Routes>
        {NAV.flatMap((s) => s.items).map((it) => (
          <Route
            key={it.to}
            path={it.to}
            element={built[it.to] ?? <Placeholder title={it.label} />}
          />
        ))}
        <Route path="*" element={<Placeholder title="Page introuvable" desc="Ce chemin n'existe pas." />} />
      </Routes>
    </AppShell>
  );
}
