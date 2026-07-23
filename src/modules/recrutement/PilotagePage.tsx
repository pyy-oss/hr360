import { ErrBar, Mini } from '@/components/mq';
import { useAuth } from '@/auth/AuthProvider';
import { useSeedDemo } from '@/modules/absences/useLeave';
import { usePipelineMetrics } from './useRecrutementFO';

const STAGE_BG: Record<string, string> = {
  nouveau: '#7C8DA0', preselection: 'var(--signal)', entretien: '#2C5468',
  offre: 'var(--gold)', embauche: 'var(--signal-deep)',
};

export function PilotagePage() {
  const { role } = useAuth();
  const { metrics, isLoading, error, isEmpty } = usePipelineMetrics();
  const seed = useSeedDemo();
  const isSuperAdmin = role === 'super_admin';

  const funnelMax = Math.max(1, ...metrics.funnel.map((s) => s.count));

  return (
    <>
      <div className="page-head">
        <h1>Pilotage prédictif</h1>
        <p>La vue d'ensemble du pipeline de recrutement — répartition par étape, conversion et postes en tension. Tous les indicateurs sont dérivés des candidatures et ouvertures réelles.</p>
      </div>

      <ErrBar error={error} prefix="Chargement des métriques impossible." />

      {isEmpty && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
          <div>Aucune candidature à analyser.{isSuperAdmin && <> <button className="btn btn-primary" style={{ padding: '4px 10px', marginLeft: 8 }} disabled={seed.isPending} onClick={() => seed.mutate()}>{seed.isPending ? 'Chargement…' : 'Charger des données de démo'}</button></>}</div>
        </div>
      )}

      <div className="grid g4" style={{ marginBottom: 16 }}>
        <div className="card kpi"><div className="k-val display">{metrics.received}</div><div className="k-lab">Candidatures en cours</div></div>
        <div className="card kpi"><div className="k-val display">{metrics.toAttach}</div><div className="k-lab">À rattacher</div></div>
        <div className="card kpi"><div className="k-val display">{metrics.hired}</div><div className="k-lab">Recrutés</div></div>
        <div className="card kpi"><div className="k-val display">{metrics.rejected}</div><div className="k-lab">Écartés</div></div>
      </div>

      <div className="grid g2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-head"><h3>Répartition par étape</h3><span className="sub">pipeline actif</span></div>
          <div className="card-pad">
            {isLoading && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Chargement…</div>}
            {!isLoading && metrics.funnel.map((s) => (
              <Mini key={s.stage} lab={s.label} w={Math.round((s.count / funnelMax) * 100)} bg={STAGE_BG[s.stage] ?? 'var(--signal)'} val={String(s.count)} />
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Taux de conversion</h3><span className="sub">entre étapes du pipeline</span></div>
          <div className="card-pad">
            {metrics.conversions.map((c) => (
              <Mini key={c.from} lab={c.label} w={c.rate ?? 0} bg="var(--signal)" val={c.rate == null ? '—' : `${c.rate} %`} labW={150} />
            ))}
            <div className="note" style={{ marginTop: 12, fontSize: 12 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
              Conversion approximative : part des candidats ayant atteint l'étape suivante ou au-delà (sans historique de transitions).
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Postes en tension</h3><span className="sub">peu de candidats au regard des ouvertures</span></div>
        <div className="card-pad">
          {metrics.pressure.length === 0 && !isLoading && (
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>Aucune ouverture de poste active.</div>
          )}
          {metrics.pressure.map((p) => (
            <div key={p.position.id} className="cand" style={{ paddingLeft: 0, paddingRight: 0 }}>
              <div style={{ flex: 1 }}>
                <div className="c-name">{p.position.title}</div>
                <div className="c-meta">{p.openings} ouverture{p.openings > 1 ? 's' : ''} · {p.candidates} candidat{p.candidates > 1 ? 's' : ''} rattaché{p.candidates > 1 ? 's' : ''}</div>
              </div>
              {p.tension
                ? <span className="chip" style={{ background: 'var(--low-soft)', color: 'var(--low)', border: 'none' }}>En tension</span>
                : <span className="chip on">Vivier suffisant</span>}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
