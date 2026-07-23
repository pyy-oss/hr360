import { Mini, Kpi, ErrBar } from '@/components/mq';
import { useAuth } from '@/auth/AuthProvider';
import { useSurveys, useSurveyResults } from '@/modules/engagement/useEngagement';
import { useTrainingPlans } from '@/modules/formation/useFormation';
import { useOrgMetrics, useLeaveByStatus, leaveStatusLabel } from '@/modules/dashboard/useMetrics';

const DEPT_COLORS = ['var(--signal-deep)', 'var(--signal)', '#2C5468', 'var(--gold)', '#7C8DA0'];
const STATUS_META: { key: 'confirme' | 'essai' | 'sortant'; lab: string; bg: string }[] = [
  { key: 'confirme', lab: 'Confirmés', bg: 'var(--high)' },
  { key: 'essai', lab: "Période d'essai", bg: 'var(--signal)' },
  { key: 'sortant', lab: 'Sortants', bg: 'var(--muted-2)' },
];
const fr1 = (n: number) => n.toFixed(1).replace('.', ',');

export function AnalyticsPage() {
  const { role } = useAuth();
  const isAllowed = ['super_admin', 'drh', 'rh', 'lecture'].includes(role ?? '');
  const canReadEngagement = ['super_admin', 'drh', 'rh'].includes(role ?? '');

  const { metrics, isLoading, error } = useOrgMetrics();
  const leave = useLeaveByStatus();
  const plans = useTrainingPlans();
  const surveys = useSurveys();
  const latestSurvey = (surveys.data ?? [])[0];
  const results = useSurveyResults(latestSurvey?.id, canReadEngagement);

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
