import { Link } from 'react-router-dom';
import { Kpi, ErrBar } from '@/components/mq';
import { useAuth } from '@/auth/AuthProvider';
import { useSeedDemo } from '@/modules/absences/useLeave';
import { useDepartments } from '@/modules/collaborateurs/useCollaborateurs';
import { usePositions } from '@/modules/recrutement/useRecrutement';
import { useOrgMetrics, useRecruitmentFunnel } from './useMetrics';

const FUNNEL_COLORS = ['var(--ink-2)', '#2C5468', 'var(--signal-deep)', 'var(--signal)', 'var(--gold)'];

function scoreTone(openings: number): string {
  if (openings >= 3) return 'sb-high';
  if (openings >= 2) return 'sb-mid';
  return 'sb-low';
}

export function DashboardPage() {
  const { role } = useAuth();
  const isSuperAdmin = role === 'super_admin';
  const { metrics, isLoading, error } = useOrgMetrics();
  const { funnel, accessible: funnelAccessible, error: funnelError } = useRecruitmentFunnel();
  const departments = useDepartments();
  const positions = usePositions();
  const seed = useSeedDemo();

  const deptName = new Map((departments.data ?? []).map((d) => [d.id, d.name]));
  const openPositions = (positions.data ?? []).filter((p) => p.status === 'ouvert');
  const maxStage = Math.max(1, ...funnel.stages.map((s) => s.count));

  const empty = !isLoading && metrics.headcount === 0 && metrics.openPositions === 0 && funnel.total === 0;

  return (
    <>
      <div className="page-head">
        <h1>Tableau de bord</h1>
        <p>Vue d'ensemble en temps réel des effectifs, du recrutement et des chantiers RH en cours — agrégée depuis les données de l'organisation.</p>
      </div>

      <ErrBar error={error} prefix="Chargement des indicateurs impossible." />

      {empty ? (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
          <div>Aucune donnée à afficher pour le moment.{isSuperAdmin && <> <button className="btn btn-primary" style={{ padding: '4px 10px', marginLeft: 8 }} disabled={seed.isPending} onClick={() => seed.mutate()}>{seed.isPending ? 'Chargement…' : 'Charger des données de démo'}</button></>}</div>
        </div>
      ) : (
        <>
          {metrics.pendingLeave > 0 && (
            <Link to="/absences" className="alert alert-warn" style={{ marginBottom: 16, textDecoration: 'none' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /></svg>
              <div><b>{metrics.pendingLeave} demande{metrics.pendingLeave > 1 ? 's' : ''} de congés</b> en attente de validation. <span style={{ textDecoration: 'underline' }}>Traiter les absences →</span></div>
            </Link>
          )}

          <div className="grid g4" style={{ marginBottom: 16 }}>
            <Kpi val={String(metrics.headcount)} lab="Effectif total"
              delta={`${metrics.departments} département${metrics.departments > 1 ? 's' : ''}`}
              icon={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></>} />
            <Kpi val={String(metrics.pendingLeave)} lab="Congés en attente"
              delta={metrics.pendingLeave > 0 ? 'à valider' : 'file vide'} deltaTone={metrics.pendingLeave > 0 ? 'dn' : 'up'}
              icon={<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>} />
            <Kpi val={String(metrics.openPositions)} lab="Postes ouverts"
              delta="recrutement actif"
              icon={<path d="M20 7h-3V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />} />
            <Kpi val={String(metrics.departuresInProgress)} lab="Départs en cours"
              delta={metrics.departuresInProgress > 0 ? 'offboarding' : 'aucun'} deltaTone={metrics.departuresInProgress > 0 ? 'dn' : 'up'}
              icon={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></>} />
          </div>

          <div className="grid g4" style={{ marginBottom: 16 }}>
            <Kpi val={metrics.confirmationRate === null ? '—' : `${metrics.confirmationRate} %`} lab="Taux de confirmation"
              delta="périodes d'essai transformées"
              icon={<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></>} />
            <Kpi val={String(metrics.activeCampaigns)} lab="Campagnes en cours"
              delta="objectifs & évaluations"
              icon={<><path d="M12 20v-6M6 20V10M18 20V4" /></>} />
            <Kpi val={String(metrics.byStatus.confirme)} lab="Collaborateurs confirmés"
              icon={<><path d="M20 6 9 17l-5-5" /></>} />
            <Kpi val={String(metrics.byStatus.essai)} lab="En période d'essai"
              icon={<><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>} />
          </div>

          <div className="grid g2">
            <div className="card">
              <div className="card-head"><h3>Entonnoir de recrutement</h3><span className="sub">{funnel.total} candidat{funnel.total > 1 ? 's' : ''}</span></div>
              <div className="card-pad">
                <ErrBar error={funnelError} prefix="Chargement des candidats impossible." />
                {!funnelAccessible ? (
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>Vue des candidats réservée à la RH/DRH et au manager du département.</div>
                ) : funnel.total === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>Aucun candidat dans le pipeline.</div>
                ) : (
                  <>
                    <div className="funnel">
                      {funnel.stages.map((s, i) => (
                        <div key={s.stage} className="fn-row">
                          <span className="fn-lab">{s.label}</span>
                          <div className="fn-bar" style={{ width: `${Math.max(6, Math.round((s.count / maxStage) * 100))}%`, background: FUNNEL_COLORS[i % FUNNEL_COLORS.length] }}>{s.count > 0 ? s.label : ''}</div>
                          <span className="fn-n">{s.count}</span>
                        </div>
                      ))}
                    </div>
                    <div className="note" style={{ marginTop: 12 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /></svg>
                      {funnel.vivier} au vivier · {funnel.rejete} écarté{funnel.rejete > 1 ? 's' : ''}.
                    </div>
                    <Link to="/vivier" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>Ouvrir le vivier</Link>
                  </>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-head"><h3>Postes ouverts</h3><span className="sub">{openPositions.length}</span></div>
              <div className="card-pad" style={{ paddingTop: 6 }}>
                {positions.isLoading && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Chargement…</div>}
                {!positions.isLoading && openPositions.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Aucun poste ouvert.</div>}
                {openPositions.map((p) => (
                  <div key={p.id} className="ref-row">
                    <div>
                      <b style={{ fontSize: '13.5px' }}>{p.title}</b>
                      <div style={{ fontSize: 12, color: 'var(--muted-2)' }}>{deptName.get(p.departmentId) ?? p.departmentId}</div>
                    </div>
                    <span className={`score-badge ${scoreTone(p.openings)} mono ref-w`}>{p.openings}</span>
                  </div>
                ))}
                <Link to="/postes" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}>Gérer les référentiels</Link>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
