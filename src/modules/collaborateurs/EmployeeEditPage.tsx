import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { EmployeeInput } from '@/types';
import { useEmployee, useDepartments, useUpsertEmployee } from './useCollaborateurs';
import { RequirePermission } from '@/auth/RequirePermission';
import { PageHead, Card, CardBody, Button, Field, Input, Select } from '@/ui';

export function EmployeeEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: emp, isLoading } = useEmployee(id);
  const { data: departments } = useDepartments();
  const upsert = useUpsertEmployee();
  const { register, handleSubmit, reset } = useForm<EmployeeInput>();

  useEffect(() => {
    if (emp) reset({
      firstName: emp.firstName, lastName: emp.lastName, email: emp.email,
      departmentId: emp.departmentId, jobTitle: emp.jobTitle,
      seniorityLevel: emp.seniorityLevel as EmployeeInput['seniorityLevel'],
      contractType: emp.contractType as EmployeeInput['contractType'],
      status: emp.status as EmployeeInput['status'],
    });
  }, [emp, reset]);

  const onSubmit = handleSubmit(async (values) => {
    await upsert.mutateAsync({ id: id!, ...values });
    navigate(`/collaborateurs/${id}`);
  });

  if (isLoading) return <div className="p-8 text-sm text-muted">Chargement…</div>;
  if (!emp) return <div className="p-8 text-sm text-muted">Collaborateur introuvable.</div>;

  return (
    <RequirePermission resource="employees" action="update"
      fallback={<div className="p-8 text-sm text-muted">Modification réservée à la RH.</div>}>
      <div className="max-w-3xl mx-auto p-8">
        <Link to={`/collaborateurs/${id}`} className="text-sm text-signal-deep hover:underline">← Fiche</Link>
        <PageHead title="Modifier le dossier" />
        <Card><CardBody>
          <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
            <Field label="Prénom"><Input {...register('firstName')} /></Field>
            <Field label="Nom"><Input {...register('lastName')} /></Field>
            <div className="col-span-2"><Field label="Email"><Input {...register('email')} /></Field></div>
            <Field label="Département">
              <Select {...register('departmentId')}>
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
            <div className="col-span-2"><Field label="Statut">
              <Select {...register('status')}>
                <option value="essai">Période d'essai</option><option value="confirme">Confirmé</option><option value="sortant">Sortant</option>
              </Select>
            </Field></div>
            <div className="col-span-2">
              <Button type="submit" disabled={upsert.isPending} className="w-full justify-center">
                {upsert.isPending ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </CardBody></Card>
      </div>
    </RequirePermission>
  );
}
