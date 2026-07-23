import { useState } from 'react';
import { ErrBar, Field } from '@/components/mq';
import { useAuth } from '@/auth/AuthProvider';
import { useEmployeesMap, useSeedDemo } from '@/modules/absences/useLeave';
import { useDirectory } from '@/modules/collaborateurs/useCollaborateurs';
import {
  useOnboardings, useStartOnboarding, useUpdateOnboardingTask, useCloseOnboarding,
  type OnboardingRow,
} from '@/modules/onboarding/useOnboarding';

function Progress({ o }: { o: OnboardingRow }) {
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

function StartForm({ onDone }: { onDone: () => void }) {
  const dir = useDirectory();
  const start = useStartOnboarding();
  const [employeeId, setEmployeeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [notes, setNotes] = useState('');
  // On propose en priorité les collaborateurs en période d'essai.
  const candidates = (dir.data ?? []).filter((e) => e.status === 'essai');
  const emp = (dir.data ?? []).find((e) => e.id === employeeId);

  const submit = () => {
    if (!emp || !startDate) return;
    start.mutate(
      { employeeId: emp.id, departmentId: emp.departmentId, startDate, notes: notes || undefined },
      { onSuccess: onDone },
    );
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-head"><h3>Démarrer une intégration</h3></div>
      <div className="card-pad">
        <ErrBar error={start.error} prefix="Démarrage impossible." />
        <div className="form-grid">
          <Field label="Collaborateur (en période d'essai)">
            <select className="field" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              <option value="">— choisir —</option>
              {candidates.map((e) => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName} · {e.jobTitle}</option>
              ))}
            </select>
          </Field>
          <Field label="Date de démarrage"><input className="field" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
          <Field label="Notes (optionnel)" style={{ gridColumn: '1 / -1' }}><input className="field" value={notes} maxLength={1000} onChange={(e) => setNotes(e.target.value)} placeholder="Parrain, particularités…" /></Field>
        </div>
        {candidates.length === 0 && <p className="c-meta" style={{ marginTop: 4 }}>Aucun collaborateur en période d'essai. Enregistrez d'abord une embauche (Contrat & embauche).</p>}
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" disabled={start.isPending || !employeeId || !startDate} onClick={submit}>{start.isPending ? 'Démarrage…' : "Démarrer l'intégration"}</button>
          <button className="btn btn-ghost" onClick={onDone}>Annuler</button>
        </div>
      </div>
    </div>
  );
}

export function OnboardingPage() {
  const { role } = useAuth();
  const list = useOnboardings();
  const updateTask = useUpdateOnboardingTask();
  const close = useCloseOnboarding();
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
          <h1>Onboarding</h1>
          <p>Dès l'embauche, un parcours d'accueil structuré et tracé : accès, matériel, parrainage, objectifs d'essai.</p>
          <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>Données réelles</span>
        </div>
        {canManage && !showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>Nouvelle intégration
          </button>
        )}
      </div>

      {showForm && <StartForm onDone={() => setShowForm(false)} />}

      <ErrBar error={list.error} prefix="Chargement des intégrations impossible." />
      <ErrBar error={updateTask.error} prefix="Mise à jour de la tâche impossible." />
      <ErrBar error={close.error} prefix="Clôture impossible." />

      {empty && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
          <div>Aucune intégration en cours.{isSuperAdmin && <> <button className="btn btn-primary" style={{ padding: '4px 10px', marginLeft: 8 }} disabled={seed.isPending} onClick={() => seed.mutate()}>{seed.isPending ? 'Chargement…' : 'Charger des données de démo'}</button></>}</div>
        </div>
      )}

      {rows.length > 0 && (
        <div className="grid g2" style={{ gridTemplateColumns: '300px 1fr', alignItems: 'start' }}>
          <div className="card">
            <div className="card-head"><h3>Intégrations</h3><span className="sub">{rows.length}</span></div>
            {rows.map((o) => (
              <div key={o.id} className="cand" style={sel?.id === o.id ? { background: 'var(--signal-soft)' } : undefined} onClick={() => setSelId(o.id)}>
                <div style={{ flex: 1 }}>
                  <div className="c-name" style={{ fontSize: 13 }}>{emap.data?.[o.employeeId] ?? o.employeeId}</div>
                  <div className="c-meta">démarrage {o.startDate}</div>
                </div>
                <span className={`chip${o.status === 'termine' ? ' on' : ''}`} style={o.status === 'en_cours' ? { background: 'var(--mid-soft)', color: 'var(--mid)', border: 'none' } : undefined}>{o.status === 'termine' ? 'Terminée' : 'En cours'}</span>
              </div>
            ))}
          </div>

          {sel && (
            <div className="card">
              <div className="card-head">
                <h3>Checklist — {emap.data?.[sel.employeeId] ?? sel.employeeId}</h3>
                <span className="sub">démarrage {sel.startDate}</span>
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
                      {close.isPending ? 'Clôture…' : "Terminer l'intégration"}
                    </button>
                    {!allDone && <span style={{ fontSize: 12, color: 'var(--muted-2)', marginLeft: 10 }}>Toutes les tâches doivent être faites.</span>}
                  </div>
                )}
                {sel.status === 'termine' && <div className="alert alert-ok" style={{ marginTop: 14, fontSize: 12 }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg><div>Intégration terminée. La confirmation de période d'essai se décide dans l'écran « Période d'essai ».</div></div>}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
