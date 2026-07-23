import { useState } from 'react';
import { ErrBar, Field } from '@/components/mq';
import { useAuth } from '@/auth/AuthProvider';
import { useSeedDemo } from '@/modules/absences/useLeave';
import { useCandidates, type CandidateRow } from './useRecrutement';
import {
  useInterviews, useScheduleInterview, useUpdateInterview, type InterviewRow,
} from './useInterviews';
import {
  InterviewScheduleInput, INTERVIEW_MODE_LABEL, INTERVIEW_STATUS_LABEL,
} from '@/types';

const RECRUITER_ROLES = ['super_admin', 'drh', 'rh', 'recruteur', 'manager'];

const dateFmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeStyle: 'short' });
const readable = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : dateFmt.format(d);
};

const candidateName = (c?: CandidateRow) =>
  c ? `${c.firstName} ${c.lastName}`.trim() : 'Candidat inconnu';

function statusChip(status: string) {
  const label = INTERVIEW_STATUS_LABEL[status] ?? status;
  if (status === 'realise') return <span className="chip on">{label}</span>;
  if (status === 'annule' || status === 'no_show')
    return <span className="chip" style={{ background: 'var(--low-soft)', color: 'var(--low)', border: 'none' }}>{label}</span>;
  return <span className="chip" style={{ background: 'var(--mid-soft)', color: 'var(--mid)', border: 'none' }}>{label}</span>;
}

/** Formulaire de planification d'un entretien. */
function ScheduleForm({ onDone }: { onDone: () => void }) {
  const schedule = useScheduleInterview();
  const candidates = useCandidates();
  const [f, setF] = useState({ candidateId: '', scheduledAt: '', mode: 'visio', interviewers: '', notes: '' });
  const [err, setErr] = useState<string | null>(null);
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  const submit = () => {
    setErr(null);
    const cand = (candidates.data ?? []).find((c) => c.id === f.candidateId);
    const interviewers = f.interviewers.split(',').map((s) => s.trim()).filter(Boolean);
    const parsed = InterviewScheduleInput.safeParse({
      candidateId: f.candidateId,
      positionId: cand?.positionId || undefined,
      scheduledAt: f.scheduledAt,
      mode: f.mode,
      interviewers: interviewers.length ? interviewers : undefined,
      notes: f.notes || undefined,
    });
    if (!parsed.success) { setErr(parsed.error.issues[0]?.message ?? 'Champs invalides.'); return; }
    schedule.mutate(parsed.data, {
      onSuccess: () => onDone(),
      onError: (e) => setErr((e as Error).message || 'Échec de la planification.'),
    });
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-head"><h3>Planifier un entretien</h3></div>
      <div className="card-pad">
        <div className="form-grid">
          <Field label="Candidat">
            <select className="field" value={f.candidateId} onChange={(e) => set('candidateId', e.target.value)}>
              <option value="">— choisir —</option>
              {(candidates.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
              ))}
            </select>
          </Field>
          <Field label="Date et heure">
            <input className="field" type="datetime-local" value={f.scheduledAt} onChange={(e) => set('scheduledAt', e.target.value)} />
          </Field>
          <Field label="Mode">
            <select className="field" value={f.mode} onChange={(e) => set('mode', e.target.value)}>
              <option value="visio">Visioconférence</option>
              <option value="present">Présentiel</option>
              <option value="tel">Téléphone</option>
            </select>
          </Field>
          <Field label="Intervenants" hint="Noms séparés par des virgules">
            <input className="field" value={f.interviewers} onChange={(e) => set('interviewers', e.target.value)} placeholder="Awa K., Jean D." />
          </Field>
          <Field label="Notes (optionnel)" style={{ gridColumn: '1 / -1' }}>
            <input className="field" value={f.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Contexte, questions à poser…" />
          </Field>
        </div>
        {err && <div className="ferr" role="alert">{err}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="btn btn-primary" disabled={schedule.isPending} onClick={submit}>{schedule.isPending ? 'Planification…' : 'Planifier'}</button>
          <button className="btn btn-ghost" onClick={onDone}>Annuler</button>
        </div>
      </div>
    </div>
  );
}

/** Carte d'un entretien de l'agenda. */
function InterviewCard({ iv, name, canManage }: { iv: InterviewRow; name: string; canManage: boolean }) {
  const update = useUpdateInterview();
  const [resched, setResched] = useState(false);
  const [when, setWhen] = useState(iv.scheduledAt);

  const setStatus = (status: 'realise' | 'annule' | 'no_show') =>
    update.mutate({ id: iv.id, status });

  const applyResched = () => {
    if (!when) return;
    update.mutate({ id: iv.id, scheduledAt: when }, { onSuccess: () => setResched(false) });
  };

  return (
    <div className="cand" style={{ alignItems: 'flex-start' }}>
      <div style={{ flex: 1 }}>
        <div className="c-name">{name}</div>
        <div className="c-meta">{readable(iv.scheduledAt)}</div>
        <div style={{ marginTop: 6, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="chip">{INTERVIEW_MODE_LABEL[iv.mode] ?? iv.mode}</span>
          {statusChip(iv.status)}
          {(iv.interviewers ?? []).map((p) => <span key={p} className="chip ref-w">{p}</span>)}
        </div>
        {iv.notes && (
          <div className="note" style={{ marginTop: 10 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /></svg>
            {iv.notes}
          </div>
        )}
        {canManage && resched && (
          <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input className="field" type="datetime-local" style={{ maxWidth: 240 }} value={when} onChange={(e) => setWhen(e.target.value)} />
            <button className="btn btn-primary" style={{ padding: '6px 10px' }} disabled={update.isPending} onClick={applyResched}>Confirmer</button>
            <button className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={() => { setResched(false); setWhen(iv.scheduledAt); }}>Annuler</button>
          </div>
        )}
        <ErrBar error={update.error} prefix="Mise à jour de l'entretien impossible." />
      </div>
      {canManage && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'stretch' }}>
          {iv.status !== 'realise' && (
            <button className="btn btn-ghost" style={{ padding: '6px 10px', color: 'var(--high)' }} disabled={update.isPending} onClick={() => setStatus('realise')}>Réalisé</button>
          )}
          {iv.status !== 'no_show' && (
            <button className="btn btn-ghost" style={{ padding: '6px 10px' }} disabled={update.isPending} onClick={() => setStatus('no_show')}>Absence</button>
          )}
          {iv.status !== 'annule' && (
            <button className="btn btn-ghost" style={{ padding: '6px 10px', color: 'var(--low)' }} disabled={update.isPending} onClick={() => setStatus('annule')}>Annuler</button>
          )}
          {!resched && (
            <button className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={() => setResched(true)}>Reprogrammer</button>
          )}
        </div>
      )}
    </div>
  );
}

export function InterviewsPage() {
  const { role } = useAuth();
  const list = useInterviews();
  const candidates = useCandidates();
  const seed = useSeedDemo();
  const [showForm, setShowForm] = useState(false);

  if (!RECRUITER_ROLES.includes(role ?? '')) {
    return (
      <>
        <div className="page-head"><h1>Entretiens</h1></div>
        <div className="card">
          <div className="card-pad">
            <div className="alert alert-info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
              <div>Cet écran est réservé au recrutement.</div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const nameOf = (candidateId: string) =>
    candidateName((candidates.data ?? []).find((c) => c.id === candidateId));

  const rows = [...(list.data ?? [])].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const now = Date.now();
  const upcoming = rows.filter((iv) => new Date(iv.scheduledAt).getTime() >= now);
  const past = rows.filter((iv) => new Date(iv.scheduledAt).getTime() < now);
  const isSuperAdmin = role === 'super_admin';
  const canManage = RECRUITER_ROLES.includes(role ?? '');
  const empty = !list.isLoading && rows.length === 0;

  return (
    <>
      <div className="page-head" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1>Entretiens</h1>
          <p>Le calendrier des entretiens de recrutement : qui rencontre qui, quand et comment. Rien ne se perd entre deux étapes.</p>
        </div>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>Planifier un entretien
          </button>
        )}
      </div>

      {showForm && <ScheduleForm onDone={() => setShowForm(false)} />}

      <ErrBar error={list.error} prefix="Chargement des entretiens impossible." />
      <ErrBar error={candidates.error} prefix="Chargement des candidats impossible." />

      {empty && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
          <div>Aucun entretien planifié.{isSuperAdmin && <> <button className="btn btn-primary" style={{ padding: '4px 10px', marginLeft: 8 }} disabled={seed.isPending} onClick={() => seed.mutate()}>{seed.isPending ? 'Chargement…' : 'Charger des données de démo'}</button></>}</div>
        </div>
      )}

      {list.isLoading && (
        <div className="card"><div className="card-pad" style={{ fontSize: 13, color: 'var(--muted)' }}>Chargement…</div></div>
      )}

      {rows.length > 0 && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-head"><h3>À venir</h3><span className="sub">{upcoming.length} entretien{upcoming.length > 1 ? 's' : ''}</span></div>
            {upcoming.length === 0
              ? <div className="card-pad" style={{ fontSize: 13, color: 'var(--muted)' }}>Aucun entretien à venir.</div>
              : upcoming.map((iv) => <InterviewCard key={iv.id} iv={iv} name={nameOf(iv.candidateId)} canManage={canManage} />)}
          </div>

          <div className="card">
            <div className="card-head"><h3>Passés</h3><span className="sub">{past.length} entretien{past.length > 1 ? 's' : ''}</span></div>
            {past.length === 0
              ? <div className="card-pad" style={{ fontSize: 13, color: 'var(--muted)' }}>Aucun entretien passé.</div>
              : past.map((iv) => <InterviewCard key={iv.id} iv={iv} name={nameOf(iv.candidateId)} canManage={canManage} />)}
          </div>
        </>
      )}
    </>
  );
}
