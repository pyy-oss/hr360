import { Mini, Kpi, ErrBar } from '@/components/mq';
import { useAuth } from '@/auth/AuthProvider';
import { useSurveys, useSurveyResults } from '@/modules/engagement/useEngagement';
import { useTrainingPlans } from '@/modules/formation/useFormation';
import { useOrgMetrics, useLeaveByStatus, leaveStatusLabel } from '@/modules/dashboard/useMetrics';
import { useMetricSnapshots, useCaptureSnapshot, type MetricSnapshot } from '@/modules/metrics/useTrends';
import { toCsv, downloadCsv } from '@/lib/csv';

const DEPT_COLORS = ['var(--signal-deep)', 'var(--signal)', '#2C5468', 'var(--gold)', '#7C8DA0'];
const STATUS_META: { key: 'confirme' | 'essai' | 'sortant'; lab: string; bg: string }[] = [
  { key: 'confirme', lab: 'Confirmés', bg: 'var(--high)' },
  { key: 'essai', lab: "Période d'essai", bg: 'var(--signal)' },
  { key: 'sortant', lab: 'Sortants', bg: 'var(--muted-2)' },
];
const fr1 = (n: number) => n.toFixed(1).replace('.', ',');

/** Colonnes de l'export CSV des tendances (clé = champ de MetricSnapshot). */
const TREND_CSV_COLUMNS = [
  { key: 'day', label: 'Jour' },
  { key: 'headcount', label: 'Effectif' },
  { key: 'essai', label: "Période d'essai" },
  { key: 'confirme', label: 'Confirmés' },
  { key: 'sortant', label: 'Sortants' },
  { key: 'openPositions', label: 'Postes ouverts' },
  { key: 'departuresInProgress', label: 'Départs en cours' },
  { key: 'pendingLeave', label: 'Congés en attente' },
  { key: 'activeCandidates', label: 'Candidats actifs' },
];

/** Mini-graphique en barres verticales CSS (aucune lib externe — CSP stricte). */
function TrendBars({ label, series, color }: {
  label: string; series: { day: string; value: number }[]; color: string;
}) {
  const max = Math.max(1, ...series.map((s) => s.value));
  const latest = series[series.length - 1];
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{label}</span>
        <b style={{ fontSize: 14 }} className="display">{latest ? latest.value : '—'}</b>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 56 }}>
        {series.map((s) => (
          <div
            key={s.day}
            title={`${s.day} : ${s.value}`}
            style={{
              flex: 1, minWidth: 3, borderRadius: '3px 3px 0 0',
              height: `${Math.max(4, Math.round((s.value / max) * 100))}%`, background: color,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function AnalyticsPage() {
  const { role } = useAuth();
  const isAllowed = ['super_admin', 'drh', 'rh', 'lecture', 'dirigeant'].includes(role ?? '');
  const canReadEngagement = ['super_admin', 'drh', 'rh', 'dirigeant'].includes(role ?? '');

  const { metrics, isLoading, error } = useOrgMetrics();
  const leave = useLeaveByStatus();
  const plans = useTrainingPlans();
  const surveys = useSurveys();
  const latestSurvey = (surveys.data ?? [])[0];
  const results = useSurveyResults(latestSurvey?.id, canReadEngagement);

  const snapshots = useMetricSnapshots();
  const capture = useCaptureSnapshot();
  const canCapture = ['super_admin', 'drh'].includes(role ?? '');
  const trendRows = snapshots.data ?? [];
  const noTrends = !snapshots.isLoading && trendRows.length === 0;
  const seriesOf = (pick: (s: MetricSnapshot) => number) =>
    trendRows.map((s) => ({ day: s.day, value: pick(s) }));

  const exportTrends = () => {
    const rows = trendRows.map((s) => s as unknown as Record<string, unknown>);
    downloadCsv(`tendances-rh-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows, TREND_CSV_COLUMNS));
  };

  if (!isAllowed) {
    return (
      <>
        <div className="page-head">
          <h1>Analytics RH</h1>
          <p>La vue d'ensemble des effectifs et de leur dynamique.</p>
        </div>
        <div className="card"><div className="card-pad" style={{ fontSize: 13, color: 'var(--muted)' }}>Analytics réservé à la RH/DRH et aux profils lecture.</div></div>
      </>
    );
  }

  const maxDept = Math.max(1, ...metrics.byDepartment.map((d) => d.count));
  const maxLeave = Math.max(1, ...(leave.data ?? []).map((l) => l.count));
  const res = results.data;
  const engagementShown = !!res && !res.belowThreshold && res.responseCount >= 3;

  return (
    <>
      <div className="page-head">
        <h1>Analytics RH</h1>
        <p>La vue d'ensemble des effectifs et de leur dynamique — agrégée en direct pour piloter la masse de talents comme un actif stratégique.</p>
        <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>Module #25 · données réelles</span>
      </div>

      <ErrBar error={error} prefix="Chargement des indicateurs impossible." />
      <ErrBar error={leave.error} prefix="Chargement des absences impossible." />

      <div className="grid g4" style={{ marginBottom: 16 }}>
        <Kpi val={isLoading ? '…' : String(metrics.headcount)} lab="Effectif total"
          delta={`${metrics.departments} département${metrics.departments > 1 ? 's' : ''}`}
          icon={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></>} />
        <Kpi val={metrics.confirmationRate === null ? '—' : `${metrics.confirmationRate} %`} lab="Taux de confirmation"
          icon={<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></>} />
        <Kpi val={String(metrics.openPositions)} lab="Postes ouverts"
          icon={<path d="M20 7h-3V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />} />
        <Kpi val={String(metrics.departuresInProgress)} lab="Départs en cours"
          icon={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></>} />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <h3>Tendances</h3>
          <span className="sub" style={{ marginRight: 'auto' }}>évolution sur {trendRows.length} instantané{trendRows.length > 1 ? 's' : ''}</span>
          <button className="btn btn-ghost" disabled={noTrends || snapshots.isLoading} onClick={exportTrends}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
            Exporter (CSV)
          </button>
          {canCapture && (
            <button className="btn btn-primary" disabled={capture.isPending} onClick={() => capture.mutate()}>
              {capture.isPending ? 'Capture…' : "Figer l'instantané du jour"}
            </button>
          )}
        </div>
        <div className="card-pad">
          <ErrBar error={snapshots.error} prefix="Chargement des tendances impossible." />
          <ErrBar error={capture.error} prefix="Capture de l'instantané impossible." />
          {capture.isSuccess && capture.data && (
            <div className="alert alert-ok" style={{ marginBottom: 14, fontSize: 12 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
              <div>Instantané du {capture.data.day} figé — l'historique est à jour.</div>
            </div>
          )}
          {snapshots.isLoading && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Chargement…</div>}
          {noTrends && (
            <div className="alert alert-info" style={{ fontSize: 12 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
              <div>Aucun instantané enregistré.{canCapture ? " Figez l'instantané du jour pour amorcer l'historique des tendances." : ' L\'historique se construira dès les premières captures.'}</div>
            </div>
          )}
          {!snapshots.isLoading && trendRows.length > 0 && (
            <div className="grid g2">
              <TrendBars label="Effectif" series={seriesOf((s) => s.headcount)} color="var(--signal)" />
              <TrendBars label="Postes ouverts" series={seriesOf((s) => s.openPositions)} color="var(--gold)" />
              <TrendBars label="Congés en attente" series={seriesOf((s) => s.pendingLeave)} color="var(--mid)" />
              <TrendBars label="Candidats actifs" series={seriesOf((s) => s.activeCandidates)} color="var(--signal-deep)" />
            </div>
          )}
        </div>
      </div>

      <div className="grid g2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-head"><h3>Répartition par département</h3><span className="sub">effectifs</span></div>
          <div className="card-pad">
            {isLoading && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Chargement…</div>}
            {!isLoading && metrics.byDepartment.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Aucun collaborateur enregistré.</div>}
            {metrics.byDepartment.map((d, i) => (
              <Mini key={d.id} lab={d.name} w={Math.round((d.count / maxDept) * 100)} bg={DEPT_COLORS[i % DEPT_COLORS.length]} val={String(d.count)} />
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Répartition par statut</h3><span className="sub">cycle collaborateur</span></div>
          <div className="card-pad">
            {isLoading && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Chargement…</div>}
            {STATUS_META.map((s) => (
              <Mini key={s.key} lab={s.lab} w={metrics.headcount ? Math.round((metrics.byStatus[s.key] / metrics.headcount) * 100) : 0} bg={s.bg} val={String(metrics.byStatus[s.key])} />
            ))}
            {metrics.confirmationRate !== null && (
              <div className="note" style={{ marginTop: 14 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></svg>
                {metrics.confirmationRate} % de l'effectif actif est confirmé.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid g2">
        <div className="card">
          <div className="card-head"><h3>Absences par statut</h3><span className="sub">demandes</span></div>
          <div className="card-pad">
            {leave.isLoading && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Chargement…</div>}
            {!leave.isLoading && (leave.data ?? []).length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Aucune demande de congés enregistrée.</div>}
            {(leave.data ?? []).map((l) => (
              <Mini key={l.status} lab={leaveStatusLabel(l.status)} w={Math.round((l.count / maxLeave) * 100)}
                bg={l.status === 'refuse' ? 'var(--low)' : l.status === 'approuve' ? 'var(--high)' : 'var(--signal)'} val={String(l.count)} />
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Plans de formation</h3><span className="sub">avancement</span></div>
          <div className="card-pad">
            {plans.isLoading && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Chargement…</div>}
            {!plans.isLoading && (plans.data ?? []).length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Aucun plan de formation.</div>}
            {(plans.data ?? []).map((p) => (
              <Mini key={p.id} lab={p.name} w={Math.max(0, Math.min(100, p.progressPct))}
                bg={p.progressPct >= 100 ? 'var(--high)' : 'var(--signal)'} val={`${p.progressPct} %`} />
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-head"><h3>Engagement</h3><span className="sub">{latestSurvey ? latestSurvey.title : 'dernière enquête'}</span></div>
        <div className="card-pad">
          {!canReadEngagement && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Résultats d'engagement réservés à la RH/DRH.</div>}
          {canReadEngagement && !latestSurvey && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Aucune enquête d'engagement.</div>}
          {canReadEngagement && latestSurvey && !engagementShown && (
            <div className="alert alert-info" style={{ fontSize: 12 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
              <div>Résultats masqués : moins de {res?.minResponses ?? 3} réponses ({res?.responseCount ?? 0} reçue{(res?.responseCount ?? 0) > 1 ? 's' : ''}). L'anonymat des répondants est préservé.</div>
            </div>
          )}
          {canReadEngagement && engagementShown && res && (
            <>
              {res.perQuestion.map((q) => (
                <Mini key={q.key} lab={q.label} w={q.avg !== null ? Math.round((q.avg / 5) * 100) : 0}
                  bg="var(--signal)" val={q.avg !== null ? `${fr1(q.avg)} / 5` : '—'} />
              ))}
              <div className="alert alert-ok" style={{ marginTop: 14, fontSize: 12 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                <div>{res.responseCount} réponses agrégées — aucune donnée individuelle exposée.</div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
