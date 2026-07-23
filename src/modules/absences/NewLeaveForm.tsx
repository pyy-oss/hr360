import { useMemo, useState } from 'react';
import { LeaveRequestInput } from '@/types';
import { Field } from '@/components/mq';
import { useSubmitLeave } from './useLeave';
import { businessDays } from './leaveDays';

export function NewLeaveForm({ onDone }: { onDone: () => void }) {
  const submit = useSubmitLeave();
  const [f, setF] = useState({ type: 'conges_payes', startDate: '', endDate: '', reason: '' });
  const [err, setErr] = useState<string | null>(null);
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));
  const days = useMemo(() => businessDays(f.startDate, f.endDate), [f.startDate, f.endDate]);

  const send = () => {
    setErr(null);
    const parsed = LeaveRequestInput.safeParse({
      type: f.type, startDate: f.startDate, endDate: f.endDate, days,
      reason: f.reason || undefined,
    });
    if (!parsed.success) { setErr(parsed.error.issues[0]?.message ?? 'Champs invalides.'); return; }
    submit.mutate(parsed.data, {
      onSuccess: () => onDone(),
      onError: (e) => setErr((e as Error).message || 'Échec de l’envoi de la demande.'),
    });
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-head"><h3>Nouvelle demande de congé</h3></div>
      <div className="card-pad">
        <div className="form-grid">
          <Field label="Type d'absence">
            <select className="field" value={f.type} onChange={(e) => set('type', e.target.value)}>
              <option value="conges_payes">Congés payés</option>
              <option value="rtt">RTT</option>
              <option value="maladie">Maladie</option>
              <option value="sans_solde">Congé sans solde</option>
              <option value="evenement_familial">Événement familial</option>
              <option value="recuperation">Récupération</option>
            </select>
          </Field>
          <Field label="Jours ouvrés">
            <input className="field" value={days ? `${days} jour${days > 1 ? 's' : ''}` : '—'} readOnly disabled />
          </Field>
          <Field label="Début"><input className="field" type="date" value={f.startDate} onChange={(e) => set('startDate', e.target.value)} /></Field>
          <Field label="Fin"><input className="field" type="date" value={f.endDate} onChange={(e) => set('endDate', e.target.value)} /></Field>
          <Field label="Motif (optionnel)" style={{ gridColumn: '1 / -1' }}><input className="field" value={f.reason} onChange={(e) => set('reason', e.target.value)} placeholder="Congés annuels, événement familial…" /></Field>
        </div>
        {err && <div className="ferr" role="alert">{err}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="btn btn-primary" disabled={submit.isPending} onClick={send}>{submit.isPending ? 'Envoi…' : 'Envoyer la demande'}</button>
          <button className="btn btn-ghost" onClick={onDone}>Annuler</button>
        </div>
      </div>
    </div>
  );
}
