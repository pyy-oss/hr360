import { Link } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';
import { can } from '@/lib/rbac';
import { useMyLeaveRequests } from '@/modules/absences/useLeave';
import { PageHead, Card, Notice } from '@/ui';

export function DashboardPage() {
  const { role, user } = useAuth();
  const { data: myLeaves } = useMyLeaveRequests();
  const pending = (myLeaves ?? []).filter((r: any) => r.status === 'soumis').length;

  const tiles = [
    { to: '/collaborateurs', title: 'Annuaire', desc: 'Équipes et dossiers' },
    { to: '/absences', title: 'Absences & congés', desc: 'Demandes et soldes' },
    { to: '/formation', title: 'Formation', desc: 'Besoins et plans' },
    { to: '/objectifs', title: 'Objectifs & évaluations', desc: 'Campagnes annuelles' },
    { to: '/staffing', title: 'Staffing & plan de charge', desc: 'Missions et affectations' },
    ...(can(role, 'settings', 'update') ? [{ to: '/admin', title: 'Administration', desc: 'Utilisateurs et rôles' }] : []),
  ];

  return (
    <div className="max-w-5xl mx-auto p-8">
      <PageHead title={`Bonjour${user?.email ? `, ${user.email.split('@')[0]}` : ''}`}
        subtitle="Voici votre espace Neurones HR 360." />

      {pending > 0 && (
        <div className="mb-6">
          <Notice tone="info">
            Vous avez <b>{pending}</b> demande(s) de congé en attente.
            <Link to="/absences" className="underline ml-1">Voir</Link>
          </Notice>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {tiles.map((t) => (
          <Link key={t.to} to={t.to} className="group">
            <Card className="p-5 h-full transition group-hover:border-signal group-hover:-translate-y-0.5">
              <div className="font-display font-semibold text-ink">{t.title}</div>
              <div className="text-sm text-muted mt-1">{t.desc}</div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
