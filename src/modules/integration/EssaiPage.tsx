import { useState } from 'react';
import { ErrBar } from '@/components/mq';
import { useAuth } from '@/auth/AuthProvider';
import { useSeedDemo } from '@/modules/absences/useLeave';
import { useDirectory } from '@/modules/collaborateurs/useCollaborateurs';
import { useOnboardings, useDecideProbation } from '@/modules/onboarding/useOnboarding';

export function EssaiPage() {
  const { role } = useAuth();
  const dir = useDirectory();
  const onboardings = useOnboardings();
  const decide = useDecideProbation();
  const seed = useSeedDemo();
  const [selId, setSelId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const canDecide = ['super_admin', 'drh', 'rh'].includes(role ?? '');
  const isSuperAdmin = role === 'super_admin';

  const inProbation = (dir.data ?? []).filter((e) => e.status === 'essai');
  const sel = inProbation.find((e) => e.id === selId) ?? inProbation[0];
  const onb = sel ? (onboardings.data ?? []).find((o) => o.employeeId === sel.id) : undefined;
  const onbPct = onb && onb.tasks.length ? Math.round((onb.tasks.filter((t) => t.done).length / onb.tasks.length) * 100) : null;
  const empty = !dir.isLoading && inProbation.length === 0;

  const submit = (outcome: 'confirme' | 'non_confirme') => {
    if (!sel) return;
    decide.mutate(
      { employeeId: sel.id, outcome, note: note || undefined },
      { onSuccess: () => { setNote(''); setSelId(null); } },
    );
  };

  return (
    <>
      <div className="page-head">
        <h1>Période d'essai</h1>
        <p>Suivi des collaborateurs en période d'essai et décision tracée à l'échéance — confirmation ou fin de contrat. Durée et règles selon la convention collective applicable, validées par la DRH.</p>
        <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>Données réelles</span>
      </div>

      <ErrBar error={dir.error} prefix="Chargement de l'annuaire impossible." />
      <ErrBar error={decide.error} prefix="Décision impossible." />

      {empty && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
          <div>Aucun collaborateur en période d'essai.{isSuperAdmin && <> <button className="btn btn-primary" style={{ padding: '4px 10px', marginLeft: 8 }} disabled={seed.isPending} onClick={() => seed.mutate()}>{seed.isPending ? 'Chargement…' : 'Charger des données de démo'}</button></>}</div>
        </div>
      )}

      {inProbation.length > 0 && (
        <div className="grid g2" style={{ gridTemplateColumns: '300px 1fr', alignItems: 'start' }}>
          <div className="card">
            <div className="card-head"><h3>En période d'essai</h3><span className="sub">{inProbation.length}</span></div>
            {inProbation.map((e) => (
              <div key={e.id} className="cand" style={sel?.id === e.id ? { background: 'var(--signal-soft)' } : undefined} onClick={() => { setSelId(e.id); setNote(''); }}>
                <div style={{ flex: 1 }}>
                  <div className="c-name" style={{ fontSize: 13 }}>{e.firstName} {e.lastName}</div>
                  <div className="c-meta">{e.jobTitle} · {e.contractType}</div>
                </div>
                <span className="chip" style={{ background: 'var(--mid-soft)', color: 'var(--mid)', border: 'none' }}>Essai</span>
              </div>
            ))}
          </div>

          {sel && (
            <div className="card">
              <div className="card-head"><h3>{sel.firstName} {sel.lastName}</h3><span className="sub">{sel.jobTitle}</span></div>
              <div className="card-pad">
                <div className="ref-row"><span>Département</span><span style={{ marginLeft: 'auto' }}>{sel.departmentId}</span></div>
                <div className="ref-row"><span>Type de contrat</span><span style={{ marginLeft: 'auto' }}>{sel.contractType}</span></div>
                <div className="ref-row" style={{ border: 'none' }}>
                  <span>Intégration</span>
                  <span style={{ marginLeft: 'auto' }}>
                    {onbPct === null ? 'aucune' : onb?.status === 'termine' ? 'terminée' : `${onbPct} %`}
                  </span>
                </div>

                {onbPct !== null && onbPct < 100 && onb?.status === 'en_cours' && (
                  <div className="note" style={{ marginTop: 12 }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>Le parcours d'intégration n'est pas terminé.</div>
                )}

                {canDecide ? (
                  <>
                    <label style={{ display: 'block', marginTop: 14, fontSize: 13, fontWeight: 600 }}>
                      Note de décision (optionnel)
                      <textarea className="field" value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Motivation, points de consolidation…" style={{ marginTop: 6, width: '100%', resize: 'vertical' }} />
                    </label>
                    <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                      <button className="btn btn-primary" disabled={decide.isPending} onClick={() => submit('confirme')}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>Confirmer l'embauche
                      </button>
                      <button className="btn btn-ghost" disabled={decide.isPending} onClick={() => { if (confirm(`Mettre fin à la période d'essai de ${sel.firstName} ${sel.lastName} ? Le collaborateur passera « sortant ».`)) submit('non_confirme'); }}>
                        Mettre fin à l'essai
                      </button>
                    </div>
                    <p className="c-meta" style={{ marginTop: 8 }}>Décision tracée dans le journal d'audit (qui, quoi, quand, avant/après).</p>
                  </>
                ) : (
                  <div className="note" style={{ marginTop: 14 }}>La décision de fin d'essai est réservée à la RH / DRH.</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
