import { Mini, ErrBar } from '@/components/mq';
import { useAuth } from '@/auth/AuthProvider';
import { usePredictAttrition } from './useAi';

const RISK_LABEL: Record<string, string> = { faible: 'Faible', modere: 'Modéré', eleve: 'Élevé' };
const riskColor = (r: string) => (r === 'eleve' ? 'var(--low)' : r === 'modere' ? 'var(--mid)' : 'var(--high)');

export function PredictionPage() {
  const { role } = useAuth();
  const predict = usePredictAttrition();
  const canRun = ['super_admin', 'drh', 'dirigeant'].includes(role ?? '');
  const data = predict.data;

  return (
    <>
      <div className="page-head" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1>Prédiction &amp; rétention</h1>
          <p>Détecter tôt les signaux — au niveau agrégé et anonyme — pour agir avant qu'il ne soit trop tard.</p>
          <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>Couche IA · Claude</span>
        </div>
        {canRun && (
          <button className="btn btn-primary" disabled={predict.isPending} onClick={() => predict.mutate()}>
            {predict.isPending ? 'Analyse…' : 'Lancer l\'analyse de rétention'}
          </button>
        )}
      </div>

      <div className="alert alert-info" style={{ marginBottom: 16 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
        <div>Ces analyses sont des <b>aides à la décision</b> collectives, jamais des verdicts individuels. Elles déclenchent des actions de soutien — jamais une mesure défavorable. Aucune donnée nominative n'est transmise au modèle.</div>
      </div>

      {!canRun && <div className="card"><div className="card-pad" style={{ fontSize: 13, color: 'var(--muted)' }}>Analyse réservée à la DRH.</div></div>}

      <ErrBar error={predict.error} prefix="Analyse indisponible." />

      {canRun && !data && !predict.isPending && (
        <div className="card"><div className="card-pad" style={{ fontSize: 13, color: 'var(--muted)' }}>Lancez l'analyse pour obtenir une évaluation du risque de rétention à partir des agrégats anonymes de l'organisation (effectifs, départs en cours, congés, engagement).</div></div>
      )}

      {data && (
        <>
          <div className="grid g2" style={{ marginBottom: 16 }}>
            <div className="card">
              <div className="card-head"><h3>Risque de rétention global</h3></div>
              <div className="card-pad">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span className="chip" style={{ background: 'transparent', color: riskColor(data.result.riskLevel), border: `1px solid ${riskColor(data.result.riskLevel)}`, fontSize: 15, padding: '6px 14px' }}>{RISK_LABEL[data.result.riskLevel] ?? data.result.riskLevel}</span>
                </div>
                <div className="section-t" style={{ marginTop: 0 }}>Facteurs de risque</div>
                {data.result.factors.map((f, i) => (
                  <div key={i} className="hyp" style={i === data.result.factors.length - 1 ? { border: 'none' } : undefined}>
                    <div className="h-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg></div>
                    <div><b>{f.factor}</b><p style={{ fontSize: '12.5px', color: 'var(--muted)' }}>{f.note}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="card-head"><h3>Actions de soutien recommandées</h3></div>
              <div className="card-pad">
                {data.result.actions.map((a, i) => (
                  <div key={i} className="hyp" style={i === data.result.actions.length - 1 ? { border: 'none' } : undefined}>
                    <div className="h-ic" style={{ background: 'var(--high-soft)', color: 'var(--high)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg></div>
                    <div><b>{a.action}</b><p style={{ fontSize: '12.5px', color: 'var(--muted)' }}>{a.note}</p></div>
                  </div>
                ))}
                <div className="note" style={{ marginTop: 12, fontSize: 12 }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>{data.result.caveat}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Agrégats utilisés (anonymes)</h3><span className="sub">base de l'analyse</span></div>
            <div className="card-pad">
              <div className="grid g4" style={{ marginBottom: 8 }}>
                <div><div className="display" style={{ fontSize: 24, fontWeight: 600 }}>{data.aggregates.headcount}</div><div style={{ fontSize: 12, color: 'var(--muted)' }}>Effectif</div></div>
                <div><div className="display" style={{ fontSize: 24, fontWeight: 600 }}>{data.aggregates.departuresInProgress}</div><div style={{ fontSize: 12, color: 'var(--muted)' }}>Départs en cours</div></div>
                <div><div className="display" style={{ fontSize: 24, fontWeight: 600 }}>{data.aggregates.pendingLeaveRequests}</div><div style={{ fontSize: 12, color: 'var(--muted)' }}>Congés en attente</div></div>
                <div><div className="display" style={{ fontSize: 24, fontWeight: 600 }}>{data.aggregates.openPositions}</div><div style={{ fontSize: 12, color: 'var(--muted)' }}>Postes ouverts</div></div>
              </div>
              {Array.isArray(data.aggregates.engagement) && data.aggregates.engagement.map((e) => (
                <Mini key={e.question} lab={e.question} w={Math.round((e.avg / 5) * 100)} bg={e.avg >= 4 ? 'var(--high)' : e.avg >= 3 ? 'var(--signal)' : 'var(--mid)'} val={e.avg.toFixed(1)} />
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
