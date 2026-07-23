import { Mini, ErrBar } from '@/components/mq';
import { useAuth } from '@/auth/AuthProvider';
import { useAnalyzeSkills } from './useAi';

const tensionVal = (t: string) => (t === 'forte' ? 85 : t === 'moyenne' ? 55 : 20);
const tensionBg = (t: string) => (t === 'forte' ? 'var(--low)' : t === 'moyenne' ? 'var(--mid)' : 'var(--high)');
const tensionLabel = (t: string) => (t === 'forte' ? 'Tension' : t === 'moyenne' ? 'À surveiller' : 'Couvert');
const APPROACH_LABEL: Record<string, string> = { former: 'Former', recruter: 'Recruter', mixte: 'Mixte' };

export function SkillsAiPage() {
  const { role } = useAuth();
  const analyze = useAnalyzeSkills();
  const canRun = ['super_admin', 'drh', 'rh'].includes(role ?? '');
  const data = analyze.data;

  return (
    <>
      <div className="page-head" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1>Intelligence des compétences</h1>
          <p>Cartographier les compétences demandées et anticiper les pénuries — pour arbitrer entre former et recruter.</p>
          <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>Couche IA · Claude</span>
        </div>
        {canRun && (
          <button className="btn btn-primary" disabled={analyze.isPending} onClick={() => analyze.mutate()}>
            {analyze.isPending ? 'Analyse…' : "Analyser l'écart de compétences"}
          </button>
        )}
      </div>

      <div className="alert alert-info" style={{ marginBottom: 16 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
        <div>Analyse au niveau <b>agrégé</b> : compétences demandées par les postes ouverts, besoins de formation et couverture du catalogue. Aide à la décision — aucune donnée nominative.</div>
      </div>

      {!canRun && <div className="card"><div className="card-pad" style={{ fontSize: 13, color: 'var(--muted)' }}>Analyse réservée à la RH/DRH.</div></div>}
      <ErrBar error={analyze.error} prefix="Analyse indisponible." />

      {canRun && !data && !analyze.isPending && (
        <div className="card"><div className="card-pad" style={{ fontSize: 13, color: 'var(--muted)' }}>Lancez l'analyse pour identifier les compétences en tension et les arbitrages « former / recruter ».</div></div>
      )}

      {data && (
        <>
          {data.result.summary && <div className="note" style={{ marginBottom: 16 }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M12 2 2 7l10 5 10-5-10-5Z" /></svg>{data.result.summary}</div>}
          <div className="grid g2" style={{ marginBottom: 16 }}>
            <div className="card">
              <div className="card-head"><h3>Compétences en tension</h3></div>
              <div className="card-pad">
                {data.result.gaps.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Aucune tension identifiée.</div>}
                {data.result.gaps.map((g) => (
                  <div key={g.skill} style={{ marginBottom: 6 }}>
                    <Mini lab={g.skill} w={tensionVal(g.tension)} bg={tensionBg(g.tension)} val={tensionLabel(g.tension)} />
                    <div style={{ fontSize: '11.5px', color: 'var(--muted-2)', margin: '-2px 0 8px 0' }}>{g.note}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="card-head"><h3>Arbitrages recommandés</h3></div>
              <div className="card-pad">
                {data.result.recommendations.map((r, i) => (
                  <div key={i} className="hyp" style={i === data.result.recommendations.length - 1 ? { border: 'none' } : undefined}>
                    <div className="h-ic" style={{ background: 'var(--signal-soft)', color: 'var(--signal-deep)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M12 2 2 7l10 5 10-5-10-5Z" /></svg></div>
                    <div><b>{r.skill} — {APPROACH_LABEL[r.approach] ?? r.approach}</b><p style={{ fontSize: '12.5px', color: 'var(--muted)' }}>{r.note}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Base de l'analyse (agrégats)</h3><span className="sub">{data.aggregates.openPositions} postes ouverts</span></div>
            <div className="card-pad">
              <div className="section-t" style={{ marginTop: 0 }}>Compétences les plus demandées</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Object.entries(data.aggregates.demandedSkills).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([s, n]) => (
                  <span key={s} className="chip ref-w">{s} · {n}</span>
                ))}
                {Object.keys(data.aggregates.demandedSkills).length === 0 && <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>Aucun poste ouvert.</span>}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
