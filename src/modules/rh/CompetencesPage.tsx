import { Mini, ErrBar } from '@/components/mq';
import { useAuth } from '@/auth/AuthProvider';
import { useAnalyzeSkills } from '@/modules/ia/useAi';
import { useCompetences, type Tension } from './useCompetences';

const PRIORITY_LABEL: Record<string, string> = { basse: 'Basse', moyenne: 'Moyenne', haute: 'Haute' };
const TENSION_TONE: Record<Tension, string> = { forte: 'sb-low', moyenne: 'sb-mid', couverte: 'sb-high' };
const TENSION_LABEL: Record<Tension, string> = { forte: 'Forte', moyenne: 'Moyenne', couverte: 'Couverte' };
const tensionVal = (t: string) => (t === 'forte' ? 85 : t === 'moyenne' ? 55 : 20);
const tensionBg = (t: string) => (t === 'forte' ? 'var(--low)' : t === 'moyenne' ? 'var(--mid)' : 'var(--high)');
const tensionLabel = (t: string) => (t === 'forte' ? 'Tension' : t === 'moyenne' ? 'À surveiller' : 'Couvert');
const APPROACH_LABEL: Record<string, string> = { former: 'Former', recruter: 'Recruter', mixte: 'Mixte' };

export function CompetencesPage() {
  const { role } = useAuth();
  const { rows, metrics, isLoading, error } = useCompetences();
  const analyze = useAnalyzeSkills();
  const canRun = ['super_admin', 'drh', 'rh'].includes(role ?? '');
  const ai = analyze.data;
  const empty = !isLoading && rows.length === 0;

  return (
    <>
      <div className="page-head" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1>Compétences &amp; carrières</h1>
          <p>La cartographie vivante des compétences de l'entreprise : ce que les postes ouverts exigent, les besoins de formation identifiés et la couverture du catalogue interne.</p>
          <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>Module #28 · données réelles</span>
        </div>
        {canRun && (
          <button className="btn btn-primary" disabled={analyze.isPending} onClick={() => analyze.mutate()}>
            {analyze.isPending ? 'Analyse…' : 'Analyse IA des compétences'}
          </button>
        )}
      </div>

      <ErrBar error={error} prefix="Chargement des compétences impossible." />

      {empty && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
          <div>Aucune compétence à cartographier pour l'instant — ouvrez des postes ou saisissez des besoins de formation pour alimenter la vue.</div>
        </div>
      )}

      {!empty && (
        <div className="grid g4" style={{ marginBottom: 16 }}>
          <div className="card kpi"><div className="k-val display">{metrics.totalSkills}</div><div className="k-lab">Compétences suivies</div></div>
          <div className="card kpi"><div className="k-val display" style={{ color: metrics.tensionCount > 0 ? 'var(--low)' : undefined }}>{metrics.tensionCount}</div><div className="k-lab">En tension forte</div></div>
          <div className="card kpi"><div className="k-val display">{metrics.coveredCount}</div><div className="k-lab">Couvertes par le catalogue</div></div>
          <div className="card kpi"><div className="k-val display">{metrics.openPositions}</div><div className="k-lab">Postes ouverts</div></div>
        </div>
      )}

      {!empty && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-head"><h3>Cartographie des compétences demandées</h3><span className="sub">{metrics.needsCount} besoin(s) de formation</span></div>
          <div className="card-pad" style={{ overflowX: 'auto' }}>
            {isLoading && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Chargement…</div>}
            {!isLoading && (
              <table className="grille-table">
                <thead>
                  <tr>
                    <th>Compétence</th>
                    <th style={{ textAlign: 'center' }}>Postes</th>
                    <th style={{ textAlign: 'center' }}>Incontournable</th>
                    <th style={{ textAlign: 'center' }}>Formation</th>
                    <th style={{ textAlign: 'center' }}>Catalogue</th>
                    <th style={{ textAlign: 'center' }}>Tension</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.skill}>
                      <td><b>{r.skill}</b></td>
                      <td style={{ textAlign: 'center' }}>{r.demand}</td>
                      <td style={{ textAlign: 'center' }}>{r.mustDemand > 0 ? <span className="tag-must">MUST · {r.mustDemand}</span> : <span style={{ color: 'var(--muted-2)' }}>—</span>}</td>
                      <td style={{ textAlign: 'center' }}>{r.topPriority ? <span className="chip ref-w">{PRIORITY_LABEL[r.topPriority]}{r.needCount > 1 ? ` · ${r.needCount}` : ''}</span> : <span style={{ color: 'var(--muted-2)' }}>—</span>}</td>
                      <td style={{ textAlign: 'center' }}>{r.covered ? <span className="chip on">Couvert</span> : <span className="chip ref-w" style={{ color: 'var(--muted)' }}>À créer</span>}</td>
                      <td style={{ textAlign: 'center' }}><span className={`score-badge ${TENSION_TONE[r.tension]}`} style={{ padding: '2px 9px' }}>{TENSION_LABEL[r.tension]}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div style={{ fontSize: 12, color: 'var(--muted-2)', marginTop: 10 }}>La tension croise l'intensité de la demande (postes / incontournables), les besoins de formation signalés et l'absence de couverture au catalogue. Les compétences en tension forte alimentent directement les plans de formation et de recrutement.</div>
          </div>
        </div>
      )}

      <div className="alert alert-info" style={{ marginBottom: 16 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
        <div>L'<b>analyse IA</b> raisonne sur ces mêmes agrégats (compétences demandées, besoins de formation, couverture du catalogue) — jamais sur des données nominatives. Sa sortie est un <b>brouillon d'aide à la décision</b> à valider par la RH (conformité ARTCI).</div>
      </div>

      {!canRun && <div className="card"><div className="card-pad" style={{ fontSize: 13, color: 'var(--muted)' }}>L'analyse IA des compétences est réservée à la RH/DRH. La cartographie ci-dessus reste consultable.</div></div>}

      <ErrBar error={analyze.error} prefix="Analyse indisponible." />

      {canRun && !ai && !analyze.isPending && (
        <div className="card"><div className="card-pad" style={{ fontSize: 13, color: 'var(--muted)' }}>Lancez l'analyse pour identifier les compétences en tension et les arbitrages « former / recruter / mixte ».</div></div>
      )}

      {ai && (
        <>
          {ai.result.summary && (
            <div className="note" style={{ marginBottom: 16 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M12 2 2 7l10 5 10-5-10-5Z" /></svg>{ai.result.summary}
            </div>
          )}
          <div className="grid g2">
            <div className="card">
              <div className="card-head"><h3>Compétences en tension (IA)</h3></div>
              <div className="card-pad">
                {ai.result.gaps.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Aucune tension identifiée.</div>}
                {ai.result.gaps.map((g) => (
                  <div key={g.skill} style={{ marginBottom: 6 }}>
                    <Mini lab={g.skill} w={tensionVal(g.tension)} bg={tensionBg(g.tension)} val={tensionLabel(g.tension)} />
                    <div style={{ fontSize: '11.5px', color: 'var(--muted-2)', margin: '-2px 0 8px 0' }}>{g.note}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="card-head"><h3>Arbitrages recommandés (IA)</h3></div>
              <div className="card-pad">
                {ai.result.recommendations.map((r, i) => (
                  <div key={i} className="hyp" style={i === ai.result.recommendations.length - 1 ? { border: 'none' } : undefined}>
                    <div className="h-ic" style={{ background: 'var(--signal-soft)', color: 'var(--signal-deep)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M12 2 2 7l10 5 10-5-10-5Z" /></svg></div>
                    <div><b>{r.skill} — {APPROACH_LABEL[r.approach] ?? r.approach}</b><p style={{ fontSize: '12.5px', color: 'var(--muted)' }}>{r.note}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
