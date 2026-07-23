import { useState } from 'react';
import { Mini, ErrBar } from '@/components/mq';
import { useAuth } from '@/auth/AuthProvider';
import {
  useSubmitResponse, useSurveyResults, useCloseSurvey, type SurveyRow,
} from './useEngagement';

/** Formulaire de réponse anonyme (note 1–5 par question). */
function PulseForm({ survey }: { survey: SurveyRow }) {
  const submit = useSubmitResponse();
  const [scores, setScores] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const allAnswered = survey.questions.every((q) => scores[q.key]);

  const send = () => {
    setErr(null);
    submit.mutate({ surveyId: survey.id, scores }, {
      onSuccess: () => setDone(true),
      onError: (e) => setErr((e as Error).message || 'Échec de l’envoi.'),
    });
  };

  if (done) return <div className="alert alert-ok" style={{ fontSize: 12 }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg><div>Merci — votre réponse anonyme a bien été enregistrée.</div></div>;

  return (
    <>
      {survey.questions.map((q) => (
        <div key={q.key} className="setting" style={{ alignItems: 'center' }}>
          <div className="st-txt"><b>{q.label}</b></div>
          <div role="radiogroup" aria-label={q.label} style={{ display: 'flex', gap: 4 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={scores[q.key] === n} aria-label={`${n} sur 5`}
                onClick={() => setScores((s) => ({ ...s, [q.key]: n }))}
                className="btn" style={{ padding: '4px 9px', background: scores[q.key] === n ? 'var(--signal)' : 'var(--line)', color: scores[q.key] === n ? '#fff' : 'var(--muted)', border: 'none' }}>
                {n}
              </button>
            ))}
          </div>
        </div>
      ))}
      {err && <div className="ferr" role="alert">{err}</div>}
      <div style={{ marginTop: 10 }}>
        <button className="btn btn-primary" disabled={!allAnswered || submit.isPending} onClick={send}>{submit.isPending ? 'Envoi…' : 'Envoyer (anonyme)'}</button>
        {!allAnswered && <span style={{ fontSize: 12, color: 'var(--muted-2)', marginLeft: 10 }}>Répondez à toutes les questions.</span>}
      </div>
    </>
  );
}

/** Résultats agrégés (RH/DRH). */
function Results({ surveyId }: { surveyId: string }) {
  const res = useSurveyResults(surveyId);
  if (res.isLoading) return <div style={{ fontSize: 13, color: 'var(--muted)' }}>Chargement des résultats…</div>;
  if (res.error) return <ErrBar error={res.error} prefix="Résultats indisponibles." />;
  const r = res.data;
  if (!r) return null;
  if (r.belowThreshold) {
    return <div className="note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>{r.responseCount} réponse{r.responseCount > 1 ? 's' : ''} — résultats masqués sous {r.minResponses} réponses (anonymat).</div>;
  }
  return (
    <>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>{r.responseCount} réponses · moyennes sur 5</div>
      {r.perQuestion.map((q) => (
        <Mini key={q.key} lab={q.label} w={q.avg ? Math.round((q.avg / 5) * 100) : 0}
          bg={q.avg && q.avg >= 4 ? 'var(--high)' : q.avg && q.avg >= 3 ? 'var(--signal)' : 'var(--mid)'}
          val={q.avg != null ? q.avg.toFixed(1) : '—'} />
      ))}
    </>
  );
}

export function SurveyCard({ survey }: { survey: SurveyRow }) {
  const { role } = useAuth();
  const isStaff = ['super_admin', 'drh', 'rh'].includes(role ?? '');
  const close = useCloseSurvey();
  const open = survey.status === 'ouverte';

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-head">
        <h3>{survey.title}</h3>
        <span className={`chip${open ? ' on' : ''}`}>{open ? 'Ouverte' : 'Fermée'}</span>
      </div>
      <div className="card-pad">
        {open && (
          <>
            <div className="section-t" style={{ marginTop: 0 }}>Répondre</div>
            <PulseForm survey={survey} />
          </>
        )}
        {isStaff && (
          <>
            <div className="section-t">Résultats (agrégés & anonymes)</div>
            <Results surveyId={survey.id} />
            {open && (
              <div style={{ marginTop: 12 }}>
                <ErrBar error={close.error} prefix="Fermeture impossible." />
                <button className="btn btn-ghost" disabled={close.isPending} onClick={() => close.mutate(survey.id)}>
                  {close.isPending ? 'Fermeture…' : 'Fermer l’enquête'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
