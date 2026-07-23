import { useMemo, useState } from 'react';
import { LeaveRequestInput } from '@/types';
import { useSubmitLeave } from './useLeave';

/** Nombre de jours ouvrés inclusifs entre deux dates ISO (lun–ven). */
function businessDays(startISO: string, endISO: string): number {
  const start = new Date(startISO);
  const end = new Date(endISO);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;
  let n = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const day = cur.getUTCDay();
    if (day !== 0 && day !== 6) n += 1;
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return n;
}

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
          <div>
            <label className="flabel">Type d'absence</label>
            <select className="field" value={f.type} onChange={(e) => set('type', e.target.value)}>
              <option value="conges_payes">Congés payés</option>
              <option value="rtt">RTT</option>
              <option value="maladie">Maladie</option>
              <option value="sans_solde">Congé sans solde</option>
              <option value="evenement_familial">Événement familial</option>
              <option value="recuperation">Récupération</option>
            </select>
          </div>
          <div>
            <label className="flabel">Jours ouvrés</label>
            <input className="field" value={days ? `${days} jour${days > 1 ? 's' : ''}` : '—'} readOnly disabled />
          </div>
          <div><label className="flabel">Début</label><input className="field" type="date" value={f.startDate} onChange={(e) => set('startDate', e.target.value)} /></div>
          <div><label className="flabel">Fin</label><input className="field" type="date" value={f.endDate} onChange={(e) => set('endDate', e.target.value)} /></div>
          <div style={{ gridColumn: '1 / -1' }}><label className="flabel">Motif (optionnel)</label><input className="field" value={f.reason} onChange={(e) => set('reason', e.target.value)} placeholder="Congés annuels, événement familial…" /></div>
        </div>
        {err && <div className="ferr">{err}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="btn btn-primary" disabled={submit.isPending} onClick={send}>{submit.isPending ? 'Envoi…' : 'Envoyer la demande'}</button>
          <button className="btn btn-ghost" onClick={onDone}>Annuler</button>
        </div>
      </div>
    </div>
  );
}
