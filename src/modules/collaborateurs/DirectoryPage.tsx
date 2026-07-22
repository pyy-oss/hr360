import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { EmployeeInput } from '@/types';
import { useDirectory, useDepartments, useUpsertEmployee } from './useCollaborateurs';
import { RequirePermission } from '@/auth/RequirePermission';
import { PageHead, Card, CardBody, Button, Field, Input, Select, Table, Row, Cell, Badge } from '@/ui';

const statusTone: Record<string, 'ok' | 'warn' | 'neutral'> = { confirme: 'ok', essai: 'warn', sortant: 'neutral' };

export function DirectoryPage() {
  const [deptFilter, setDeptFilter] = useState('');
  const { data: people, isLoading } = useDirectory(deptFilter);
  const { data: departments } = useDepartments();
  const upsert = useUpsertEmployee();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm<EmployeeInput>();

  const onCreate = handleSubmit(async (values) => {
    const parsed = EmployeeInput.safeParse(values);
    if (!parsed.success) return;
    await upsert.mutateAsync(parsed.data);
    reset(); setOpen(false);
  });

  return (
    <div className="max-w-5xl mx-auto p-8">
      <PageHead title="Annuaire" subtitle="Collaborateurs, équipes et dossiers.">
        <RequirePermission resource="employees" action="read">
          <Select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="w-48">
            <option value="">Tous les départements</option>
            {(departments ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </RequirePermission>
        <RequirePermission resource="employees" action="create">
          <Button onClick={() => setOpen((v) => !v)}>{open ? 'Fermer' : 'Nouveau collaborateur'}</Button>
        </RequirePermission>
      </PageHead>

      {open && (
        <Card className="mb-6">
          <CardBody>
            <form onSubmit={onCreate} className="grid grid-cols-2 gap-4">
              <Field label="Prénom"><Input {...register('firstName')} /></Field>
              <Field label="Nom"><Input {...register('lastName')} /></Field>
              <Field label="Email"><Input {...register('email')} /></Field>
              <Field label="Département">
                <Select {...register('departmentId')}>
                  <option value="">Sélectionner…</option>
                  {(departments ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </Select>
              </Field>
              <Field label="Intitulé de poste"><Input {...register('jobTitle')} /></Field>
              <Field label="Niveau">
                <Select {...register('seniorityLevel')}>
                  <option value="junior">Junior</option><option value="confirme">Confirmé</option>
                  <option value="senior">Senior</option><option value="lead">Lead</option><option value="manager">Manager</option>
                </Select>
              </Field>
              <Field label="Contrat">
                <Select {...register('contractType')}>
                  <option value="cdi">CDI</option><option value="cdd">CDD</option>
                  <option value="stage">Stage</option><option value="alternance">Alternance</option><option value="prestation">Prestation</option>
                </Select>
              </Field>
              <Field label="Date d'embauche"><Input type="date" {...register('hireDate')} /></Field>
              <div className="col-span-2">
                <Button type="submit" disabled={upsert.isPending} className="w-full justify-center">
                  {upsert.isPending ? 'Enregistrement…' : 'Créer le dossier'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {isLoading ? <p className="text-muted text-sm">Chargement…</p> : (
        <Table head={['Nom', 'Poste', 'Département', 'Statut']}>
          {(people ?? []).map((p) => (
            <Row key={p.id}>
              <Cell><Link to={`/collaborateurs/${p.id}`} className="text-signal-deep font-medium hover:underline">{p.lastName} {p.firstName}</Link></Cell>
              <Cell>{p.jobTitle}</Cell>
              <Cell>{p.departmentId}</Cell>
              <Cell><Badge tone={statusTone[p.status] ?? 'neutral'}>{p.status}</Badge></Cell>
            </Row>
          ))}
          {(people ?? []).length === 0 && <Row><Cell className="text-muted">Aucun collaborateur.</Cell></Row>}
        </Table>
      )}
    </div>
  );
}
