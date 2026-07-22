import { useParams, Link } from 'react-router-dom';
import { useEmployee } from './useCollaborateurs';
import { RequirePermission } from '@/auth/RequirePermission';
import { WorkloadBar } from '@/modules/staffing/WorkloadBar';
import { Card, CardBody, Badge } from '@/ui';

const statusTone: Record<string, 'ok' | 'warn' | 'neutral'> = { confirme: 'ok', essai: 'warn', sortant: 'neutral' };

export function EmployeePage() {
  const { id } = useParams();
  const { data: emp, isLoading } = useEmployee(id);

  if (isLoading) return <div className="p-8 text-sm text-muted">Chargement…</div>;
  if (!emp) return <div className="p-8 text-sm text-muted">Collaborateur introuvable.</div>;

  return (
    <div className="max-w-3xl mx-auto p-8">
      <Link to="/collaborateurs" className="text-sm text-signal-deep hover:underline">← Annuaire</Link>
      <Card className="mt-3">
        <CardBody className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-display font-semibold text-ink tracking-tight">{emp.lastName} {emp.firstName}</h1>
              <p className="text-muted">{emp.jobTitle} · {emp.departmentId}</p>
            </div>
            <Badge tone={statusTone[emp.status] ?? 'neutral'}>{emp.status}</Badge>
          </div>

          <dl className="grid grid-cols-2 gap-4 mt-6 text-sm">
            <Field label="Email" value={emp.email} />
            <Field label="Niveau" value={emp.seniorityLevel} />
            <Field label="Contrat" value={emp.contractType} />
            <Field label="Compte lié" value={emp.uid ? 'Oui' : 'Non'} />
          </dl>

          <div className="mt-6 pt-4 border-t border-line">
            <WorkloadBar employeeId={emp.id} />
          </div>

          <RequirePermission resource="employees" action="update">
            <div className="mt-6 pt-4 border-t border-line">
              <Link to={`/collaborateurs/${emp.id}/edit`} className="text-sm text-signal-deep hover:underline">Modifier le dossier</Link>
            </div>
          </RequirePermission>
        </CardBody>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-muted-2">{label}</dt>
      <dd className="font-medium text-ink">{value ?? '—'}</dd>
    </div>
  );
}
