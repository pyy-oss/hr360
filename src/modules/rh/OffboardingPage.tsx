import { useState } from 'react';
import { ErrBar } from '@/components/mq';
import { useAuth } from '@/auth/AuthProvider';
import { useEmployeesMap, useSeedDemo } from '@/modules/absences/useLeave';
import {
  useOffboardings, useUpdateOffboardingTask, useCloseOffboarding, type OffboardingRow,
} from '@/modules/offboarding/useOffboarding';
import { NewOffboardingForm } from '@/modules/offboarding/NewOffboardingForm';

const REASON_LABEL: Record<string, string> = {
  demission: 'Démission', licenciement: 'Licenciement', fin_cdd: 'Fin de CDD',
  rupture_conventionnelle: 'Rupture conventionnelle', retraite: 'Retraite', autre: 'Autre',
};

function Progress({ o }: { o: OffboardingRow }) {
  const done = o.tasks.filter((t) => t.done).length;
  const pct = o.tasks.length ? Math.round((done / o.tasks.length) * 100) : 0;
  return (
    <div className="mini" style={{ marginTop: 4 }}>
      <span className="m-lab" style={{ width: 90 }}>{done}/{o.tasks.length} tâches</span>
      <div className="m-track"><div className="mf" style={{ width: `${pct}%`, background: pct === 100 ? 'var(--high)' : 'var(--signal)' }} /></div>
      <span className="m-val">{pct} %</span>
    </div>
  );
}

export function OffboardingPage() {
  const { role } = useAuth();
  const list = useOffboardings();
  const updateTask = useUpdateOffboardingTask();
  const close = useCloseOffboarding();
  const emap = useEmployeesMap();
  const seed = useSeedDemo();
  const [showForm, setShowForm] = useState(false);
  const [selId, setSelId] = useState<string | null>(null);

  const rows = list.data ?? [];
  const sel = rows.find((o) => o.id === selId) ?? rows[0];
  const canManage = ['super_admin', 'drh', 'rh'].includes(role ?? '');
  const canToggle = ['super_admin', 'drh', 'rh', 'manager'].includes(role ?? '');
  const isSuperAdmin = role === 'super_admin';
  const empty = !list.isLoading && rows.length === 0;
  const allDone = sel ? sel.tasks.every((t) => t.done) : false;

  return (
    <>
      <div className="page-head" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1>Offboarding</h1>
          <p>Un départ bien géré protège l'entreprise : passation, restitution, révocation des accès et clôture tracée.</p>
          <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>Module #34 · données réelles</span>
        </div>
        {canManage && !showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>Nouveau départ
          </button>
        )}
      </div>

      {showForm && <NewOffboardingForm onDone={() => setShowForm(false)} />}

      <ErrBar error={list.error} prefix="Chargement des offboardings impossible." />
      <ErrBar error={updateTask.error} prefix="Mise à jour de la tâche impossible." />
      <ErrBar error={close.error} prefix="Clôture impossible." />

      {empty && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
          <div>Aucun départ en cours.{isSuperAdmin && <> <button className="btn btn-primary" style={{ padding: '4px 10px', marginLeft: 8 }} disabled={seed.isPending} onClick={() => seed.mutate()}>{seed.isPending ? 'Chargement…' : 'Charger des données de démo'}</button></>}</div>
        </div>
      )}

      {rows.length > 0 && (
        <div className="grid g2" style={{ gridTemplateColumns: '300px 1fr', alignItems: 'start' }}>
          <div className="card">
            <div className="card-head"><h3>Départs</h3><span className="sub">{rows.length}</span></div>
            {rows.map((o) => (
              <div key={o.id} className="cand" style={sel?.id === o.id ? { background: 'var(--signal-soft)' } : undefined} onClick={() => setSelId(o.id)}>
                <div style={{ flex: 1 }}>
                  <div className="c-name" style={{ fontSize: 13 }}>{emap.data?.[o.employeeId] ?? o.employeeId}</div>
                  <div className="c-meta">{REASON_LABEL[o.reason] ?? o.reason} · dernier jour {o.lastDay}</div>
                </div>
                <span className={`chip${o.status === 'cloture' ? ' on' : ''}`} style={o.status === 'en_cours' ? { background: 'var(--mid-soft)', color: 'var(--mid)', border: 'none' } : undefined}>{o.status === 'cloture' ? 'Clôturé' : 'En cours'}</span>
              </div>
            ))}
          </div>

          {sel && (
            <div className="card">
              <div className="card-head">
                <h3>Checklist — {emap.data?.[sel.employeeId] ?? sel.employeeId}</h3>
                <span className="sub">{REASON_LABEL[sel.reason] ?? sel.reason}</span>
              </div>
              <div className="card-pad">
                <Progress o={sel} />
                <div style={{ marginTop: 12 }}>
                  {sel.tasks.map((t) => (
                    <div key={t.key} className="setting">
                      <div className="st-txt"><b style={t.done ? { textDecoration: 'line-through', color: 'var(--muted)' } : undefined}>{t.label}</b></div>
                      <button
                        className={`tog${t.done ? ' on' : ''}`}
                        aria-label={`${t.done ? 'Décocher' : 'Cocher'} : ${t.label}`}
                        disabled={sel.status !== 'en_cours' || !canToggle || updateTask.isPending}
                        onClick={() => updateTask.mutate({ id: sel.id, taskKey: t.key, done: !t.done })}
                        style={{ cursor: sel.status === 'en_cours' && canToggle ? 'pointer' : 'default', border: 'none', background: t.done ? 'var(--signal)' : 'var(--line)' }}
                      />
                    </div>
                  ))}
                </div>
                {sel.notes && <div className="note" style={{ marginTop: 12 }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /></svg>{sel.notes}</div>}
                {canManage && sel.status === 'en_cours' && (
                  <div style={{ marginTop: 14 }}>
                    <button className="btn btn-primary" disabled={!allDone || close.isPending} onClick={() => close.mutate(sel.id)}>
                      {close.isPending ? 'Clôture…' : 'Clôturer le départ'}
                    </button>
                    {!allDone && <span style={{ fontSize: 12, color: 'var(--muted-2)', marginLeft: 10 }}>Toutes les tâches doivent être faites.</span>}
                  </div>
                )}
                {sel.status === 'cloture' && <div className="alert alert-ok" style={{ marginTop: 14, fontSize: 12 }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg><div>Départ clôturé — le collaborateur est passé « sortant ».</div></div>}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
