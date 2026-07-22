import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { MissionInput } from '@/types';
import { useMissions, useUpsertMission } from './useStaffing';
import { useDepartments } from '@/modules/collaborateurs/useCollaborateurs';
import { RequirePermission } from '@/auth/RequirePermission';
import { PageHead, Card, CardBody, Button, Field, Input, Select, Table, Row, Cell, Badge } from '@/ui';

const tone: Record<string, 'ok' | 'teal' | 'warn' | 'neutral'> = {
  active: 'ok', prospect: 'teal', suspendue: 'warn', terminee: 'neutral',
};
const label: Record<string, string> = { prospect: 'Prospect', active: 'Active', terminee: 'Terminée', suspendue: 'Suspendue' };

export function StaffingPage() {
  const { data: missions, isLoading } = useMissions();
  const { data: departments } = useDepartments();
  const upsert = useUpsertMission();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm<MissionInput>();

  const onCreate = handleSubmit(async (values) => {
    const parsed = MissionInput.safeParse(values);
    if (!parsed.success) return;
    await upsert.mutateAsync(parsed.data);
    reset(); setOpen(false);
  });

  return (
    <div className="max-w-5xl mx-auto p-8">
      <PageHead title="Staffing & plan de charge" subtitle="Missions, affectations et charge des équipes.">
        <RequirePermission resource="employees" action="update">
          <Button onClick={() => setOpen((v) => !v)}>{open ? 'Fermer' : 'Nouvelle mission'}</Button>
        </RequirePermission>
      </PageHead>

      {open && (
        <Card className="mb-6"><CardBody>
          <form onSubmit={onCreate} className="grid grid-cols-2 gap-4">
            <Field label="Nom de la mission"><Input {...register('name')} /></Field>
            <Field label="Client"><Input {...register('client')} /></Field>
            <Field label="Département">
              <Select {...register('departmentId')}>
                <option value="">Sélectionner…</option>
                {(departments ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </Field>
            <Field label="Statut">
              <Select {...register('status')}>
                <option value="prospect">Prospect</option><option value="active">Active</option>
                <option value="suspendue">Suspendue</option><option value="terminee">Terminée</option>
              </Select>
            </Field>
            <Field label="Début"><Input type="date" {...register('startDate')} /></Field>
            <Field label="Fin"><Input type="date" {...register('endDate')} /></Field>
            <div className="col-span-2">
              <Button type="submit" disabled={upsert.isPending} className="w-full justify-center">
                {upsert.isPending ? 'Enregistrement…' : 'Créer la mission'}
              </Button>
            </div>
          </form>
        </CardBody></Card>
      )}

      {isLoading ? <p className="text-muted text-sm">Chargement…</p> : (
        <Table head={['Mission', 'Client', 'Département', 'Période', 'Statut']}>
          {(missions ?? []).map((m) => (
            <Row key={m.id}>
              <Cell className="font-medium text-ink">{m.name}</Cell>
              <Cell>{m.client}</Cell>
              <Cell>{m.departmentId}</Cell>
              <Cell className="font-mono text-xs">{m.startDate}{m.endDate ? ` → ${m.endDate}` : ''}</Cell>
              <Cell><Badge tone={tone[m.status] ?? 'neutral'}>{label[m.status] ?? m.status}</Badge></Cell>
            </Row>
          ))}
          {(missions ?? []).length === 0 && <Row><Cell className="text-muted">Aucune mission.</Cell></Row>}
        </Table>
      )}
    </div>
  );
}
