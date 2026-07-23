import { Mini, Kpi } from '@/components/mq';
import { useMissions, useAllAssignments } from '@/modules/staffing/useStaffing';
import { useEmployeesMap, useSeedDemo } from '@/modules/absences/useLeave';
import { useAuth } from '@/auth/AuthProvider';

function allocBg(pct: number) {
  if (pct >= 100) return 'var(--signal-deep)';
  if (pct >= 70) return 'var(--signal)';
  if (pct >= 40) return 'var(--gold)';
  return 'var(--muted-2)';
}
function missionChip(status: string) {
  if (status === 'active') return <span className="chip on ref-w" style={{ marginLeft: 'auto' }}>En cours</span>;
  if (status === 'prospect') return <span className="chip ref-w" style={{ marginLeft: 'auto', background: 'var(--mid-soft)', color: 'var(--mid)', border: 'none' }}>Pipeline</span>;
  if (status === 'terminee') return <span className="chip ref-w" style={{ marginLeft: 'auto' }}>Terminée</span>;
  return <span className="chip ref-w" style={{ marginLeft: 'auto' }}>{status}</span>;
}

export function StaffingPage() {
  const { role } = useAuth();
  const missions = useMissions();
  const assignments = useAllAssignments();
  const emap = useEmployeesMap();
  const seed = useSeedDemo();

  const ms = missions.data ?? [];
  const as = assignments.data ?? [];
  const staffed = new Set(as.map((a) => a.employeeId)).size;
  const activeMissions = ms.filter((m) => m.status === 'active').length;
  const pipeline = ms.filter((m) => m.status === 'prospect').length;
  const tace = as.length ? Math.round(as.reduce((s, a) => s + (a.allocationPct ?? 0), 0) / as.length) : 0;
  const empty = !missions.isLoading && !assignments.isLoading && ms.length === 0 && as.length === 0;
  const isSuperAdmin = role === 'super_admin';

  return (
    <>
      <div className="page-head">
        <h1>Staffing &amp; plan de charge</h1>
        <p>Le cœur d'une société de services : affecter les bons consultants aux bonnes missions, suivre le taux d'occupation et anticiper les tensions.</p>
        <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>Module #30 · données réelles</span>
      </div>

      {empty && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
          <div>Aucune mission ni affectation.{isSuperAdmin && <> <button className="btn btn-primary" style={{ padding: '4px 10px', marginLeft: 8 }} disabled={seed.isPending} onClick={() => seed.mutate()}>{seed.isPending ? 'Chargement…' : 'Charger des données de démo'}</button></>}</div>
        </div>
      )}

      <div className="grid g4" style={{ marginBottom: 16 }}>
        <Kpi val={`${tace} %`} lab="Taux d'occupation moyen" />
        <Kpi val={`${staffed}`} lab="Consultants staffés" />
        <Kpi val={`${activeMissions}`} lab="Missions actives" />
        <Kpi val={`${pipeline}`} lab="Missions en pipeline" />
      </div>

      <div className="grid g2">
        <div className="card">
          <div className="card-head"><h3>Affectation des consultants</h3></div>
          <div className="card-pad">
            {assignments.isLoading && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Chargement…</div>}
            {!assignments.isLoading && as.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Aucune affectation.</div>}
            {as.map((a) => (
              <Mini key={a.id} lab={emap.data?.[a.employeeId] ?? a.employeeId} w={a.allocationPct} bg={allocBg(a.allocationPct)} val={`${a.allocationPct} %`} />
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Missions</h3></div>
          <div className="card-pad">
            {missions.isLoading && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Chargement…</div>}
            {!missions.isLoading && ms.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Aucune mission.</div>}
            {ms.map((m, i) => (
              <div key={m.id} className="ref-row" style={i === ms.length - 1 ? { border: 'none' } : undefined}>
                <div><b style={{ fontSize: 13 }}>{m.name}</b><div style={{ fontSize: 12, color: 'var(--muted-2)' }}>{m.client}</div></div>
                {missionChip(m.status)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
