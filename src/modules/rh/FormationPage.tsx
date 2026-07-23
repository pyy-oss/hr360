import { Mini } from '@/components/mq';
import { useTrainingPlans, useTrainingCatalog } from '@/modules/formation/useFormation';
import { useSeedDemo } from '@/modules/absences/useLeave';
import { useAuth } from '@/auth/AuthProvider';

const planBg = (p: number) => (p >= 80 ? 'var(--high)' : p >= 50 ? 'var(--signal)' : 'var(--gold)');

export function FormationPage() {
  const { role } = useAuth();
  const plans = useTrainingPlans();
  const catalog = useTrainingCatalog();
  const seed = useSeedDemo();
  const ps = plans.data ?? [];
  const cs = catalog.data ?? [];
  const empty = !plans.isLoading && !catalog.isLoading && ps.length === 0 && cs.length === 0;
  const isSuperAdmin = role === 'super_admin';

  return (
    <>
      <div className="page-head">
        <h1>Formation</h1>
        <p>Le catalogue, les plans de montée en compétences et le suivi des certifications — reliés à la matrice de compétences et aux besoins de recrutement.</p>
        <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>Module #29 · données réelles</span>
      </div>

      {empty && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
          <div>Aucun plan ni catalogue de formation.{isSuperAdmin && <> <button className="btn btn-primary" style={{ padding: '4px 10px', marginLeft: 8 }} disabled={seed.isPending} onClick={() => seed.mutate()}>{seed.isPending ? 'Chargement…' : 'Charger des données de démo'}</button></>}</div>
        </div>
      )}

      <div className="grid g2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-head"><h3>Plans en cours</h3></div>
          <div className="card-pad">
            {plans.isLoading && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Chargement…</div>}
            {!plans.isLoading && ps.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Aucun plan en cours.</div>}
            {ps.map((p) => <Mini key={p.id} lab={p.name} w={p.progressPct} bg={planBg(p.progressPct)} val={`${p.progressPct} %`} />)}
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Catalogue interne</h3><span className="sub">Académie Neurones</span></div>
          <div className="card-pad">
            {catalog.isLoading && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Chargement…</div>}
            {!catalog.isLoading && cs.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Catalogue vide.</div>}
            {cs.map((c, i) => (
              <div key={c.id} className="ref-row" style={i === cs.length - 1 ? { border: 'none' } : undefined}><span>{c.name}</span><span className="chip ref-w" style={{ marginLeft: 'auto' }}>{c.tag}</span></div>
            ))}
          </div>
        </div>
      </div>
      <div className="note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2 2 7l10 5 10-5-10-5Z" /></svg>Chaque case faible de la matrice de compétences propose automatiquement un module du catalogue — la formation devient pilotée par les besoins réels.</div>
    </>
  );
}
