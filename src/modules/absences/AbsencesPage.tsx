import { useForm } from 'react-hook-form';
import { LeaveRequestInput } from '@/types';
import { useMyLeaveRequests, useSubmitLeave } from './useLeave';
import { RequirePermission } from '@/auth/RequirePermission';
import { PageHead, Card, CardBody, CardHead, Button, Field, Input, Select, Table, Row, Cell, Badge } from '@/ui';

const tone: Record<string, 'ok' | 'warn' | 'danger' | 'teal' | 'neutral'> = {
  approuve: 'ok', soumis: 'teal', valide_manager: 'teal', refuse: 'danger', annule: 'neutral',
};

export function AbsencesPage() {
  const { data: requests, isLoading } = useMyLeaveRequests();
  const submit = useSubmitLeave();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<LeaveRequestInput>();

  const onSubmit = handleSubmit(async (values) => {
    const parsed = LeaveRequestInput.safeParse({ ...values, days: Number(values.days) });
    if (!parsed.success) return;
    await submit.mutateAsync(parsed.data);
    reset();
  });

  return (
    <div className="max-w-3xl mx-auto p-8">
      <PageHead title="Absences & congés" subtitle="Déposez et suivez vos demandes." />

      <RequirePermission resource="leaveRequests" action="create">
        <Card className="mb-6">
          <CardHead title="Nouvelle demande" />
          <CardBody>
            <form onSubmit={onSubmit} className="grid gap-4">
              <Field label="Type d'absence">
                <Select {...register('type')}>
                  <option value="conges_payes">Congés payés</option>
                  <option value="rtt">RTT</option>
                  <option value="maladie">Maladie</option>
                  <option value="sans_solde">Sans solde</option>
                  <option value="recuperation">Récupération</option>
                </Select>
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Du"><Input type="date" {...register('startDate')} /></Field>
                <Field label="Au"><Input type="date" {...register('endDate')} /></Field>
                <Field label="Jours"><Input type="number" step="0.5" {...register('days')} /></Field>
              </div>
              <Field label="Motif (optionnel)" error={errors.endDate?.message}>
                <Input {...register('reason')} />
              </Field>
              <Button type="submit" disabled={submit.isPending} className="justify-center">
                {submit.isPending ? 'Envoi…' : 'Déposer la demande'}
              </Button>
            </form>
          </CardBody>
        </Card>
      </RequirePermission>

      <h2 className="font-display font-semibold text-ink mb-3">Mes demandes</h2>
      {isLoading ? <p className="text-muted text-sm">Chargement…</p> : (
        <Table head={['Type', 'Période', 'Jours', 'Statut']}>
          {(requests ?? []).map((r: any) => (
            <Row key={r.id}>
              <Cell>{r.type}</Cell>
              <Cell className="font-mono text-xs">{r.startDate} → {r.endDate}</Cell>
              <Cell>{r.days}</Cell>
              <Cell><Badge tone={tone[r.status] ?? 'neutral'}>{r.status}</Badge></Cell>
            </Row>
          ))}
          {(requests ?? []).length === 0 && <Row><Cell className="text-muted">Aucune demande.</Cell></Row>}
        </Table>
      )}
    </div>
  );
}
