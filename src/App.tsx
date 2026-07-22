import { Routes, Route } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';
import { LoginPage } from '@/auth/LoginPage';
import { AppShell } from '@/components/AppShell';
import { DashboardPage } from '@/modules/dashboard/DashboardPage';
import { DirectoryPage } from '@/modules/collaborateurs/DirectoryPage';
import { EmployeePage } from '@/modules/collaborateurs/EmployeePage';
import { EmployeeEditPage } from '@/modules/collaborateurs/EmployeeEditPage';
import { AbsencesPage } from '@/modules/absences/AbsencesPage';
import { FormationPage } from '@/modules/formation/FormationPage';
import { ObjectifsPage } from '@/modules/objectifs/ObjectifsPage';
import { StaffingPage } from '@/modules/staffing/StaffingPage';
import { UsersAdminPage } from '@/modules/admin/UsersAdminPage';

export function App() {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-sm text-slate-500">Chargement…</div>;
  if (!user) return <LoginPage />;

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/collaborateurs" element={<DirectoryPage />} />
        <Route path="/collaborateurs/:id" element={<EmployeePage />} />
        <Route path="/collaborateurs/:id/edit" element={<EmployeeEditPage />} />
        <Route path="/absences" element={<AbsencesPage />} />
        <Route path="/formation" element={<FormationPage />} />
        <Route path="/objectifs" element={<ObjectifsPage />} />
        <Route path="/staffing" element={<StaffingPage />} />
        <Route path="/admin" element={<UsersAdminPage />} />
        <Route path="*" element={<div className="p-8">Page introuvable.</div>} />
      </Routes>
    </AppShell>
  );
}
