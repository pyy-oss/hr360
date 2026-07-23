import { Routes, Route } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';
import { LoginPage } from '@/auth/LoginPage';
import { AppShell } from '@/components/AppShell';
import { DashboardPage } from '@/modules/dashboard/DashboardPage';
import { BoiteRhPage } from '@/modules/recrutement/BoiteRhPage';
import { VivierPage } from '@/modules/recrutement/VivierPage';
import { ScoringPage } from '@/modules/recrutement/ScoringPage';
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
