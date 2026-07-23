import { useState } from 'react';
import { Mini, ErrBar } from '@/components/mq';
import { useAuth } from '@/auth/AuthProvider';
import { useEmployeesMap, useSeedDemo } from '@/modules/absences/useLeave';
import {
  useCampaigns, useCampaignObjectives, useAdvancePhase, useValidateObjective,
} from '@/modules/objectifs/useObjectifs';
import { NewObjectiveForm } from '@/modules/objectifs/NewObjectiveForm';

const PHASES = ['preparation', 'fixation', 'suivi', 'evaluation', 'cloturee'] as const;
const PHASE_LABEL: Record<string, string> = {
  preparation: 'Préparation', fixation: 'Fixation', suivi: 'Suivi', evaluation: 'Évaluation', cloturee: 'Clôturée',
};
const STATUS_LABEL: Record<string, string> = {
  brouillon: 'Brouillon', valide: 'Validé', atteint: 'Atteint', partiel: 'Partiel', non_atteint: 'Non atteint',
};
function nextPhase(p: string) {
  const i = PHASES.indexOf(p as typeof PHASES[number]);
  return i >= 0 && i < PHASES.length - 1 ? PHASES[i + 1] : null;
}
const objBg = (status: string) =>
  status === 'atteint' ? 'var(--high)' : status === 'non_atteint' ? 'var(--low)'
    : status === 'valide' ? 'var(--signal-deep)' : 'var(--gold)';

function statusChip(status: string) {
  const on = status === 'valide' || status === 'atteint';
  const bad = status === 'non_atteint';
  return (
    <span className={`chip${on ? ' on' : ''}`} style={bad ? { background: 'var(--low-soft)', color: 'var(--low)', border: 'none' } : status === 'brouillon' ? { background: 'var(--mid-soft)', color: 'var(--mid)', border: 'none' } : undefined}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export function PerformancePage() {
  const { role } = useAuth();
  const campaigns = useCampaigns();
  const advance = useAdvancePhase();
  const validate = useValidateObjective();
  const emap = useEmployeesMap();
  const seed = useSeedDemo();
  const [selId, setSelId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const cs = campaigns.data ?? [];
  const selected = cs.find((c) => c.id === selId) ?? cs[0];
  const objectives = useCampaignObjectives(selected?.id);
  const obj = objectives.data ?? [];

  const isSuperAdmin = role === 'super_admin';
  const canAdvance = ['super_admin', 'drh'].includes(role ?? '');
  const canValidate = ['super_admin', 'drh', 'rh', 'manager'].includes(role ?? '');
  const canCreate = ['super_admin', 'drh', 'rh', 'manager', 'collaborateur'].includes(role ?? '');
  const empty = !campaigns.isLoading && cs.length === 0;

  // Total des pondérations affiché par personne sélectionnée (guide 100 %).
  const totalWeight = obj.reduce((s, o) => s + (o.weight ?? 0), 0);

  return (
    <>
      <div className="page-head" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1>Performance &amp; objectifs</h1>
          <p>Campagnes annuelles de fixation d'objectifs et d'évaluation — la performance se pilote toute l'année, pas une fois par an.</p>
          <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>Module #27 · données réelles</span>
        </div>
        {selected && canCreate && !showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>Nouvel objectif
          </button>
        )}
      </div>

      {showForm && selected && <NewObjectiveForm campaignId={selected.id} onDone={() => setShowForm(false)} />}

      <ErrBar error={campaigns.error ?? objectives.error} prefix="Chargement des campagnes impossible." />
      <ErrBar error={advance.error} prefix="Changement de phase impossible." />
      <ErrBar error={validate.error} prefix="Validation impossible." />

      {empty && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
          <div>Aucune campagne d'objectifs.{isSuperAdmin && <> <button className="btn btn-primary" style={{ padding: '4px 10px', marginLeft: 8 }} disabled={seed.isPending} onClick={() => seed.mutate()}>{seed.isPending ? 'Chargement…' : 'Charger des données de démo'}</button></>}</div>
        </div>
      )}

      {cs.length > 0 && (
        <div className="grid g2" style={{ gridTemplateColumns: '280px 1fr', alignItems: 'start' }}>
          <div className="card">
            <div className="card-head"><h3>Campagnes</h3><span className="sub">{cs.length}</span></div>
            {campaigns.isLoading && <div className="card-pad" style={{ fontSize: 13, color: 'var(--muted)' }}>Chargement…</div>}
            {cs.map((c) => (
              <div key={c.id} className="cand" style={selected?.id === c.id ? { background: 'var(--signal-soft)' } : undefined} onClick={() => { setSelId(c.id); setShowForm(false); }}>
                <div style={{ flex: 1 }}>
                  <div className="c-name" style={{ fontSize: 13 }}>{c.name}</div>
                  <div className="c-meta">Année {c.year}</div>
                </div>
                <span className={`chip${c.phase !== 'cloturee' ? ' on' : ''}`}>{PHASE_LABEL[c.phase] ?? c.phase}</span>
              </div>
            ))}
          </div>

          {selected && (
            <div className="card">
              <div className="card-head">
                <h3>Objectifs — {selected.name}</h3>
                <span className="sub">Phase : {PHASE_LABEL[selected.phase] ?? selected.phase}</span>
              </div>
              <div className="card-pad">
                {canAdvance && nextPhase(selected.phase) && (
                  <div style={{ marginBottom: 12 }}>
                    <button className="btn btn-ghost" disabled={advance.isPending}
                      onClick={() => advance.mutate({ campaignId: selected.id, toPhase: nextPhase(selected.phase)! })}>
                      Passer en phase « {PHASE_LABEL[nextPhase(selected.phase)!]} »
                    </button>
                  </div>
                )}

                {objectives.isLoading && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Chargement…</div>}
                {!objectives.isLoading && obj.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Aucun objectif sur cette campagne (dans votre périmètre).</div>}

                {obj.map((o) => (
                  <div key={o.id} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <b style={{ fontSize: 13, flex: 1 }}>{o.title}</b>
                      {statusChip(o.status)}
                      {canValidate && o.status === 'brouillon' && (
                        <button className="btn btn-ghost" style={{ padding: '4px 10px' }} disabled={validate.isPending}
                          onClick={() => validate.mutate({ objectiveId: o.id })}>Valider</button>
                      )}
                    </div>
                    <Mini lab={emap.data?.[o.employeeId] ?? o.employeeId} w={o.weight} bg={objBg(o.status)} val={`${o.weight} %`} />
                    {o.measure && <div style={{ fontSize: 12, color: 'var(--muted-2)', marginTop: 2 }}>{o.measure}</div>}
                  </div>
                ))}

                {obj.length > 0 && (
                  <div className="note" style={{ marginTop: 8 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                    Total des pondérations affichées : <b style={{ marginLeft: 4, color: totalWeight === 100 ? 'var(--high)' : 'var(--gold)' }}>{totalWeight} %</b>
                    {totalWeight !== 100 && ' — la somme par personne doit valoir 100 %.'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
