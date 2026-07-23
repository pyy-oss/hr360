import { useState } from 'react';
import { ErrBar, Field } from '@/components/mq';
import { useAuth } from '@/auth/AuthProvider';
import { useEmployeesMap } from '@/modules/absences/useLeave';
import {
  useCampaignEvaluations, useOpenEvaluations, useSubmitEvaluation,
  usePublishEvaluationById, useSaveSelfAssessment, type EvaluationRow,
} from './useObjectifs';

const EVAL_STATUS: Record<string, string> = {
  en_cours: 'En cours', soumise: 'Soumise', publiee: 'Publiée',
};
function evalChip(status: string) {
  const on = status === 'publiee';
  return <span className={`chip${on ? ' on' : ''}`} style={status === 'soumise' ? { background: 'var(--mid-soft)', color: 'var(--mid)', border: 'none' } : undefined}>{EVAL_STATUS[status] ?? status}</span>;
}
const stars = (n?: number | null) => (n ? '★'.repeat(n) + '☆'.repeat(5 - n) : '—');

/** Formulaire d'évaluation manager (appréciation + note), en_cours → soumise. */
function ManagerEval({ ev, name }: { ev: EvaluationRow; name: string }) {
  const submit = useSubmitEvaluation();
  const [text, setText] = useState('');
  const [rating, setRating] = useState('3');
  const [err, setErr] = useState<string | null>(null);
  const send = () => {
    setErr(null);
    if (text.trim().length < 1) { setErr('Rédigez une appréciation.'); return; }
    submit.mutate({ evaluationId: ev.id, managerAssessment: text, rating: Number(rating) }, {
      onError: (e) => setErr((e as Error).message || 'Échec.'),
    });
  };
  return (
    <div style={{ marginTop: 6 }}>
      <Field label={`Appréciation — ${name}`}>
        <textarea className="field" rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Points forts, axes de progrès…" />
      </Field>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginTop: 6 }}>
        <Field label="Note /5" style={{ width: 100 }}>
          <select className="field" value={rating} onChange={(e) => setRating(e.target.value)}>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </Field>
        <button className="btn btn-primary" disabled={submit.isPending} onClick={send}>{submit.isPending ? 'Soumission…' : 'Soumettre'}</button>
      </div>
      {err && <div className="ferr" role="alert">{err}</div>}
    </div>
  );
}

/** Auto-évaluation du collaborateur (écriture directe autorisée par les règles). */
function SelfEval({ ev }: { ev: EvaluationRow }) {
  const save = useSaveSelfAssessment();
  const [text, setText] = useState(ev.selfAssessment ?? '');
  const [ok, setOk] = useState(false);
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-head"><h3>Mon auto-évaluation</h3>{evalChip(ev.status)}</div>
      <div className="card-pad">
        {ev.status === 'en_cours' && (
          <>
            <Field label="Ma contribution sur la période">
              <textarea className="field" rows={3} value={text} onChange={(e) => { setText(e.target.value); setOk(false); }} placeholder="Réalisations, difficultés, besoins…" />
            </Field>
            <ErrBar error={save.error} prefix="Enregistrement impossible." />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
              <button className="btn btn-primary" disabled={save.isPending} onClick={() => save.mutate({ evaluationId: ev.id, selfAssessment: text }, { onSuccess: () => setOk(true) })}>{save.isPending ? 'Enregistrement…' : 'Enregistrer'}</button>
              {ok && <span style={{ fontSize: 12, color: 'var(--high)' }}>Enregistré ✓</span>}
            </div>
          </>
        )}
        {ev.status === 'soumise' && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Votre évaluation a été rédigée par votre manager et sera visible après publication.</div>}
        {ev.status === 'publiee' && (
          <>
            <div className="section-t" style={{ marginTop: 0 }}>Appréciation du manager · note {stars(ev.rating)}</div>
            <p style={{ fontSize: 13 }}>{ev.managerAssessment || '—'}</p>
            {ev.selfAssessment && <><div className="section-t">Mon auto-évaluation</div><p style={{ fontSize: 13, color: 'var(--muted)' }}>{ev.selfAssessment}</p></>}
          </>
        )}
      </div>
    </div>
  );
}

export function CampaignEvaluations({ campaignId }: { campaignId: string }) {
  const { role } = useAuth();
  const evals = useCampaignEvaluations(campaignId);
  const open = useOpenEvaluations();
  const publish = usePublishEvaluationById();
  const emap = useEmployeesMap();

  const isStaff = ['super_admin', 'drh', 'rh', 'lecture'].includes(role ?? '');
  const isManager = role === 'manager';
  const canOpen = ['super_admin', 'drh', 'rh'].includes(role ?? '');
  const canDecide = ['super_admin', 'drh', 'rh', 'manager'].includes(role ?? '');
  const rows = evals.data ?? [];

  // Vue collaborateur : une seule évaluation, la sienne.
  if (!isStaff && !isManager) {
    if (evals.isLoading) return <div style={{ fontSize: 13, color: 'var(--muted)' }}>Chargement…</div>;
    if (rows.length === 0) return <div className="card"><div className="card-pad" style={{ fontSize: 13, color: 'var(--muted)' }}>Aucune évaluation ouverte pour cette campagne.</div></div>;
    return <SelfEval ev={rows[0]} />;
  }

  // Vue RH / manager.
  return (
    <div className="card">
      <div className="card-head">
        <h3>Évaluations</h3>
        {canOpen && (
          <button className="btn btn-ghost" style={{ padding: '4px 10px' }} disabled={open.isPending}
            onClick={() => open.mutate(campaignId)}>{open.isPending ? 'Ouverture…' : 'Ouvrir les évaluations'}</button>
        )}
      </div>
      <div className="card-pad">
        <ErrBar error={evals.error} prefix="Chargement des évaluations impossible." />
        <ErrBar error={open.error} prefix="Ouverture impossible." />
        <ErrBar error={publish.error} prefix="Publication impossible." />
        {evals.isLoading && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Chargement…</div>}
        {!evals.isLoading && rows.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Aucune évaluation. {canOpen && '« Ouvrir les évaluations » pour lancer le cycle.'}</div>}
        {rows.map((ev) => (
          <div key={ev.id} className="ref-row" style={{ flexWrap: 'wrap', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <b style={{ fontSize: 13 }}>{emap.data?.[ev.employeeId] ?? ev.employeeId}</b>
              {ev.status === 'publiee' && <span style={{ fontSize: 12, color: 'var(--gold)', marginLeft: 8 }}>{stars(ev.rating)}</span>}
            </div>
            {evalChip(ev.status)}
            {canDecide && ev.status === 'soumise' && (
              <button className="btn btn-primary" style={{ padding: '4px 10px' }} disabled={publish.isPending}
                onClick={() => publish.mutate(ev.id)}>Publier</button>
            )}
            {canDecide && ev.status === 'en_cours' && <div style={{ flexBasis: '100%' }}><ManagerEval ev={ev} name={emap.data?.[ev.employeeId] ?? ev.employeeId} /></div>}
          </div>
        ))}
      </div>
    </div>
  );
}
