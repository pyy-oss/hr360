import { useDepartmentNeeds, useMyEnrollments, useUpdateEnrollment } from './useFormation';
import { RequirePermission } from '@/auth/RequirePermission';
import { PageHead, Table, Row, Cell, Badge, Button } from '@/ui';

const prioTone: Record<string, 'danger' | 'warn' | 'neutral'> = { haute: 'danger', moyenne: 'warn', basse: 'neutral' };

export function FormationPage() {
  const { data: needs, isLoading: loadingNeeds } = useDepartmentNeeds();
  const { data: enrollments, isLoading: loadingEnr } = useMyEnrollments();
  const updateEnrollment = useUpdateEnrollment();

  return (
    <div className="max-w-4xl mx-auto p-8">
      <PageHead title="Formation" subtitle="Besoins des équipes et parcours individuels." />

      <RequirePermission resource="trainingPlans" action="read">
        <section className="mb-8">
          <h2 className="font-display font-semibold text-ink mb-3">Besoins de mon équipe</h2>
          {loadingNeeds ? <p className="text-muted text-sm">Chargement…</p> : (
            <Table head={['Compétence', 'Priorité', 'Source', 'Statut']}>
              {(needs ?? []).map((n: any) => (
                <Row key={n.id}>
                  <Cell className="font-medium text-ink">{n.skill}</Cell>
                  <Cell><Badge tone={prioTone[n.priority] ?? 'neutral'}>{n.priority}</Badge></Cell>
                  <Cell>{n.source}</Cell>
                  <Cell>{n.status}</Cell>
                </Row>
              ))}
              {(needs ?? []).length === 0 && <Row><Cell className="text-muted">Aucun besoin ouvert.</Cell></Row>}
            </Table>
          )}
        </section>
      </RequirePermission>

      <section>
        <h2 className="font-display font-semibold text-ink mb-3">Mes formations</h2>
        {loadingEnr ? <p className="text-muted text-sm">Chargement…</p> : (
          <Table head={['Formation', 'Statut', '']}>
            {(enrollments ?? []).map((e: any) => (
              <Row key={e.id}>
                <Cell className="font-medium text-ink">{e.catalogId}</Cell>
                <Cell><Badge tone="teal">{e.status}</Badge></Cell>
                <Cell className="text-right">
                  <RequirePermission resource="trainingPlans" action="update">
                    <Button variant="subtle" onClick={() => updateEnrollment.mutate({ id: e.id, status: 'termine' })}>Marquer terminé</Button>
                  </RequirePermission>
                </Cell>
              </Row>
            ))}
            {(enrollments ?? []).length === 0 && <Row><Cell className="text-muted">Aucune inscription.</Cell></Row>}
          </Table>
        )}
      </section>
    </div>
  );
}
