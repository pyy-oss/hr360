import { useState } from 'react';
import { useCampaigns, useMyObjectives, useAdvancePhase, useValidateObjective } from './useObjectifs';
import { RequirePermission } from '@/auth/RequirePermission';
import { PageHead, Table, Row, Cell, Badge, Button } from '@/ui';

const PHASES = ['preparation', 'fixation', 'suivi', 'evaluation', 'cloturee'] as const;
function nextPhase(p: string) {
  const i = PHASES.indexOf(p as typeof PHASES[number]);
  return i >= 0 && i < PHASES.length - 1 ? PHASES[i + 1] : null;
}
const objTone: Record<string, 'ok' | 'warn' | 'danger' | 'teal' | 'neutral'> = {
  atteint: 'ok', partiel: 'warn', non_atteint: 'danger', valide: 'teal', brouillon: 'neutral',
};

export function ObjectifsPage() {
  const { data: campaigns, isLoading } = useCampaigns();
  const [selected, setSelected] = useState<string | undefined>();
  const { data: objectives } = useMyObjectives(selected);
  const advance = useAdvancePhase();
  const validate = useValidateObjective();

  return (
    <div className="max-w-4xl mx-auto p-8">
      <PageHead title="Objectifs & évaluations" subtitle="Campagnes annuelles et suivi individuel." />

      <section className="mb-8">
        <h2 className="font-display font-semibold text-ink mb-3">Campagnes</h2>
        {isLoading ? <p className="text-muted text-sm">Chargement…</p> : (
          <Table head={['Campagne', 'Année', 'Phase', '']}>
            {(campaigns ?? []).map((c: any) => (
              <Row key={c.id}>
                <Cell><button onClick={() => setSelected(c.id)} className="font-medium text-signal-deep hover:underline">{c.name}</button></Cell>
                <Cell>{c.year}</Cell>
                <Cell><Badge tone="teal">{c.phase}</Badge></Cell>
                <Cell className="text-right">
                  <RequirePermission resource="campaigns" action="update">
                    {nextPhase(c.phase) && (
                      <Button variant="subtle" onClick={() => advance.mutate({ campaignId: c.id, toPhase: nextPhase(c.phase)! })}>
                        → {nextPhase(c.phase)}
                      </Button>
                    )}
                  </RequirePermission>
                </Cell>
              </Row>
            ))}
            {(campaigns ?? []).length === 0 && <Row><Cell className="text-muted">Aucune campagne.</Cell></Row>}
          </Table>
        )}
      </section>

      {selected && (
        <section>
          <h2 className="font-display font-semibold text-ink mb-3">Mes objectifs</h2>
          <Table head={['Objectif', 'Pondération', 'Statut', '']}>
            {(objectives ?? []).map((o: any) => (
              <Row key={o.id}>
                <Cell className="font-medium text-ink">{o.title}</Cell>
                <Cell className="font-mono text-xs">{o.weight}%</Cell>
                <Cell><Badge tone={objTone[o.status] ?? 'neutral'}>{o.status}</Badge></Cell>
                <Cell className="text-right">
                  <RequirePermission resource="objectives" action="update">
                    {o.status === 'brouillon' && (
                      <Button variant="subtle" onClick={() => validate.mutate({ objectiveId: o.id })}>Valider</Button>
                    )}
                  </RequirePermission>
                </Cell>
              </Row>
            ))}
            {(objectives ?? []).length === 0 && <Row><Cell className="text-muted">Aucun objectif.</Cell></Row>}
          </Table>
          <p className="text-xs text-muted-2 mt-2">La somme des pondérations doit valoir 100 % (validée à la soumission).</p>
        </section>
      )}
    </div>
  );
}
