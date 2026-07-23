import { useMemo } from 'react';
import { Mini, ErrBar } from '@/components/mq';
import { useAuth } from '@/auth/AuthProvider';
import { useDirectory, useDepartments } from '@/modules/collaborateurs/useCollaborateurs';
import { usePositions } from '@/modules/recrutement/useRecrutement';
import { useOffboardings } from '@/modules/offboarding/useOffboarding';
import { useAnalyzeSkills, usePredictAttrition } from './useAi';

const STATUS_LABEL: Record<string, string> = { essai: "Période d'essai", confirme: 'Confirmés', sortant: 'Sortants' };
const STATUS_BG: Record<string, string> = { essai: 'var(--gold)', confirme: 'var(--high)', sortant: 'var(--low)' };
const RISK_LABEL: Record<string, string> = { faible: 'Faible', modere: 'Modéré', eleve: 'Élevé' };
const riskColor = (r: string) => (r === 'eleve' ? 'var(--low)' : r === 'modere' ? 'var(--mid)' : 'var(--high)');
const tensionVal = (t: string) => (t === 'forte' ? 85 : t === 'moyenne' ? 55 : 20);
const tensionBg = (t: string) => (t === 'forte' ? 'var(--low)' : t === 'moyenne' ? 'var(--mid)' : 'var(--high)');
const tensionLabel = (t: string) => (t === 'forte' ? 'Tension' : t === 'moyenne' ? 'À surveiller' : 'Couvert');

export function WorkforcePage() {
  const { role } = useAuth();
  const canRun = ['super_admin', 'drh'].includes(role ?? '');

  const directory = useDirectory();
  const departments = useDepartments();
  const positions = usePositions();
  const offboardings = useOffboardings();
  const skills = useAnalyzeSkills();
  const predict = usePredictAttrition();

  const employees = directory.data ?? [];
  const openPositions = (positions.data ?? []).filter((p) => p.status === 'ouvert');
  const departures = (offboardings.data ?? []).filter((o) => o.status === 'en_cours');

  const byStatus = useMemo(() => {
    const acc: Record<string, number> = { essai: 0, confirme: 0, sortant: 0 };
    employees.forEach((e) => { acc[e.status] = (acc[e.status] ?? 0) + 1; });
    return acc;
  }, [employees]);

  const byDept = useMemo(() => {
    const names = new Map((departments.data ?? []).map((d) => [d.id, d.name] as const));
    const acc = new Map<string, number>();
    employees.forEach((e) => acc.set(e.departmentId, (acc.get(e.departmentId) ?? 0) + 1));
    return Array.from(acc.entries())
      .map(([id, count]) => ({ id, name: names.get(id) ?? id, count }))
      .sort((a, b) => b.count - a.count);
  }, [employees, departments.data]);

  const totalOpenings = openPositions.reduce((s, p) => s + (p.openings ?? 0), 0);
  const maxDept = byDept.reduce((m, d) => Math.max(m, d.count), 0) || 1;
  const loading = directory.isLoading || positions.isLoading || offboardings.isLoading;

  if (!canRun) {
    return (
      <>
        <div className="page-head">
          <h1>Workforce planning IA</h1>
          <p>Planifier les effectifs — effectif actuel, postes à pourvoir, départs en cours — et anticiper les tensions.</p>
        </div>
        <div className="card"><div className="card-pad" style={{ fontSize: 13, color: 'var(--muted)' }}>Cet espace est réservé à la direction RH (DRH / super-admin).</div></div>
      </>
    );
  }

  return (
    <>
      <div className="page-head">
        <h1>Workforce planning IA</h1>
        <p>Une lecture d'ensemble de l'effectif — répartition, postes à pourvoir, départs en cours — enrichie à la demande par l'analyse des tensions de compétences et du risque de rétention.</p>
        <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>Couche IA · Claude</span>
      </div>

      <ErrBar error={directory.error ?? positions.error ?? offboardings.error} prefix="Chargement des effectifs impossible." />

      <div className="grid g4" style={{ marginBottom: 16 }}>
        <div className="card kpi"><div className="k-val display">{loading ? '…' : employees.length}</div><div className="k-lab">Effectif actuel</div></div>
        <div className="card kpi"><div className="k-val display">{loading ? '…' : openPositions.length}</div><div className="k-lab">Postes ouverts{totalOpenings > openPositions.length ? ` · ${totalOpenings} postes` : ''}</div></div>
        <div className="card kpi"><div className="k-val display" style={{ color: departures.length > 0 ? 'var(--low)' : undefined }}>{loading ? '…' : departures.length}</div><div className="k-lab">Départs en cours</div></div>
        <div className="card kpi"><div className="k-val display">{loading ? '…' : (employees.length - byStatus.sortant + openPositions.length)}</div><div className="k-lab">Cible à couvrir</div></div>
      </div>

      <div className="grid g2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-head"><h3>Répartition par département</h3><span className="sub">{byDept.length} département(s)</span></div>
          <div className="card-pad">
            {loading && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Chargement…</div>}
            {!loading && byDept.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Aucun collaborateur enregistré.</div>}
            {byDept.map((d) => (
              <Mini key={d.id} lab={d.name} w={Math.round((d.count / maxDept) * 100)} bg="var(--signal)" val={`${d.count}`} />
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Par statut de contrat</h3></div>
          <div className="card-pad">
            {loading && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Chargement…</div>}
            {!loading && employees.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Aucun collaborateur.</div>}
            {!loading && employees.length > 0 && (['essai', 'confirme', 'sortant'] as const).map((s) => (
              <Mini key={s} lab={STATUS_LABEL[s]} w={employees.length ? Math.round((byStatus[s] / employees.length) * 100) : 0} bg={STATUS_BG[s]} val={`${byStatus[s]}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="alert alert-info" style={{ marginBottom: 16 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
        <div>Les lectures prospectives ci-dessous sont des <b>aides à la décision</b> collectives et anonymes — jamais des verdicts individuels. Aucune donnée nominative n'est transmise au modèle (conformité ARTCI).</div>
      </div>

      <div className="grid g2">
        <div className="card">
          <div className="card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Tensions de compétences</h3>
            <button className="btn btn-primary" style={{ padding: '5px 11px' }} disabled={skills.isPending} onClick={() => skills.mutate()}>
              {skills.isPending ? 'Analyse…' : 'Analyser'}
            </button>
          </div>
          <div className="card-pad">
            <ErrBar error={skills.error} prefix="Analyse indisponible." />
            {!skills.data && !skills.isPending && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Lancez l'analyse pour repérer les compétences en tension à combler par recrutement, formation ou mobilité.</div>}
            {skills.data && (
              <>
                {skills.data.result.summary && <div className="note" style={{ marginBottom: 12 }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M12 2 2 7l10 5 10-5-10-5Z" /></svg>{skills.data.result.summary}</div>}
                {skills.data.result.gaps.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Aucune tension identifiée.</div>}
                {skills.data.result.gaps.map((g) => (
                  <div key={g.skill} style={{ marginBottom: 6 }}>
                    <Mini lab={g.skill} w={tensionVal(g.tension)} bg={tensionBg(g.tension)} val={tensionLabel(g.tension)} />
                    <div style={{ fontSize: '11.5px', color: 'var(--muted-2)', margin: '-2px 0 8px 0' }}>{g.note}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Risque de rétention</h3>
            <button className="btn btn-primary" style={{ padding: '5px 11px' }} disabled={predict.isPending} onClick={() => predict.mutate()}>
              {predict.isPending ? 'Analyse…' : 'Analyser'}
            </button>
          </div>
          <div className="card-pad">
            <ErrBar error={predict.error} prefix="Analyse indisponible." />
            {!predict.data && !predict.isPending && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Lancez l'analyse pour estimer, à partir des agrégats anonymes, le risque de rétention et les actions de soutien.</div>}
            {predict.data && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span className="chip" style={{ background: 'transparent', color: riskColor(predict.data.result.riskLevel), border: `1px solid ${riskColor(predict.data.result.riskLevel)}`, fontSize: 14, padding: '5px 13px' }}>Risque {RISK_LABEL[predict.data.result.riskLevel] ?? predict.data.result.riskLevel}</span>
                </div>
                <div className="section-t" style={{ marginTop: 0 }}>Actions de soutien</div>
                {predict.data.result.actions.map((a, i) => (
                  <div key={i} className="hyp" style={i === predict.data!.result.actions.length - 1 ? { border: 'none' } : undefined}>
                    <div className="h-ic" style={{ background: 'var(--high-soft)', color: 'var(--high)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg></div>
                    <div><b>{a.action}</b><p style={{ fontSize: '12.5px', color: 'var(--muted)' }}>{a.note}</p></div>
                  </div>
                ))}
                <div className="note" style={{ marginTop: 12, fontSize: 12 }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>{predict.data.result.caveat}</div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
