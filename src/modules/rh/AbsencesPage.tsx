import { useState } from 'react';
import { Mini } from '@/components/mq';
import { useAuth } from '@/auth/AuthProvider';
import {
  usePendingLeave, useLeaveBalances, useEmployeesMap, useDecideLeave, useSeedDemo,
} from '@/modules/absences/useLeave';
import { NewLeaveForm } from '@/modules/absences/NewLeaveForm';

const TYPE_LABEL: Record<string, string> = {
  conges_payes: 'Congés payés', rtt: 'RTT', maladie: 'Maladie',
  sans_solde: 'Congé sans solde', evenement_familial: 'Événement familial', recuperation: 'Récupération',
};
const BAL_BG = ['var(--signal)', 'var(--signal)', 'var(--mid)', 'var(--signal-deep)'];

export function AbsencesPage() {
  const { role, employeeId } = useAuth();
  const pending = usePendingLeave();
  const balances = useLeaveBalances();
  const emap = useEmployeesMap();
  const decide = useDecideLeave();
  const seed = useSeedDemo();
  const isSuperAdmin = role === 'super_admin';
  const [showForm, setShowForm] = useState(false);

  const requests = pending.data ?? [];
  const bals = balances.data ?? [];
  const empty = !pending.isLoading && !balances.isLoading && requests.length === 0 && bals.length === 0;

  return (
    <>
      <div className="page-head" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1>Absences &amp; congés</h1>
          <p>Demandes, validations et soldes en un seul flux — avec une vue de disponibilité pour ne jamais staffer un absent.</p>
          <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>Module #31 · données réelles</span>
        </div>
        {employeeId && !showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14" /></svg>Nouvelle demande
          </button>
        )}
      </div>

      {showForm && <NewLeaveForm onDone={() => setShowForm(false)} />}

      {empty && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
          <div>
            Aucune donnée d'absence pour l'instant.
            {isSuperAdmin && (
              <> <button className="btn btn-primary" style={{ padding: '4px 10px', marginLeft: 8 }} disabled={seed.isPending} onClick={() => seed.mutate()}>
                {seed.isPending ? 'Chargement…' : 'Charger des données de démo'}
              </button></>
            )}
          </div>
        </div>
      )}

      <div className="grid g2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-head"><h3>Demandes en attente</h3><span className="sub">{requests.length} à valider</span></div>
          <div className="card-pad">
            {pending.isLoading && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Chargement…</div>}
            {!pending.isLoading && requests.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Aucune demande en attente.</div>}
            {requests.map((r) => (
              <div key={r.id} className="setting">
                <div className="st-txt">
                  <b>{TYPE_LABEL[r.type] ?? r.type} — {r.days} jour{r.days > 1 ? 's' : ''}</b>
                  <p>{r.employeeName ?? emap.data?.[r.employeeId] ?? r.employeeId} · {r.startDate}</p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-primary" style={{ padding: '6px 10px' }} disabled={decide.isPending}
                    onClick={() => decide.mutate({ id: r.id, decision: 'approuve' })}>Valider</button>
                  <button className="btn btn-ghost" style={{ padding: '6px 10px' }} disabled={decide.isPending}
                    onClick={() => decide.mutate({ id: r.id, decision: 'refuse' })}>Refuser</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Soldes de congés</h3></div>
          <div className="card-pad">
            {balances.isLoading && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Chargement…</div>}
            {!balances.isLoading && bals.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Aucun solde à afficher.</div>}
            {bals.map((b, i) => {
              const ent = b.entitlements?.conges_payes ?? 0;
              const taken = b.taken?.conges_payes ?? 0;
              const pend = b.pending?.conges_payes ?? 0;
              const remaining = Math.max(0, ent - taken - pend);
              const w = ent ? Math.round((remaining / ent) * 100) : 0;
              return <Mini key={b.id} lab={emap.data?.[b.employeeId] ?? b.employeeId} w={w} bg={BAL_BG[i % BAL_BG.length]} val={`${remaining} j`} />;
            })}
          </div>
        </div>
      </div>
    </>
  );
}
