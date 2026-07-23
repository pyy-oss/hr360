import { useState } from 'react';
import { SalaryBandInput } from '@/types';
import { Field } from '@/components/mq';
import { useUpsertSalaryBand } from './useRemuneration';

const LEVEL_LABEL: Record<string, string> = {
  junior: 'Palier 1 — Junior', confirme: 'Palier 2 — Confirmé',
  senior: 'Palier 3 — Senior', lead: 'Palier 4 — Lead', manager: 'Palier 5 — Manager',
};

export function NewSalaryBandForm({ onDone }: { onDone: () => void }) {
  const upsert = useUpsertSalaryBand();
  const [f, setF] = useState({ level: 'junior', label: LEVEL_LABEL.junior, minAmount: '', midAmount: '', maxAmount: '' });
  const [err, setErr] = useState<string | null>(null);
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));
  const onLevel = (lv: string) => setF((s) => ({ ...s, level: lv, label: LEVEL_LABEL[lv] ?? s.label }));

  const submit = () => {
    setErr(null);
    const parsed = SalaryBandInput.safeParse({
      level: f.level, label: f.label,
      minAmount: Number(f.minAmount), midAmount: Number(f.midAmount), maxAmount: Number(f.maxAmount),
    });
    if (!parsed.success) { setErr(parsed.error.issues[0]?.message ?? 'Champs invalides.'); return; }
    upsert.mutate(parsed.data, {
      onSuccess: () => onDone(),
      onError: (e) => setErr((e as Error).message || 'Échec de l’enregistrement.'),
    });
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-head"><h3>Définir une bande salariale</h3></div>
      <div className="card-pad">
        <div className="form-grid">
          <Field label="Palier">
            <select className="field" value={f.level} onChange={(e) => onLevel(e.target.value)}>
              <option value="junior">Junior</option><option value="confirme">Confirmé</option>
              <option value="senior">Senior</option><option value="lead">Lead</option><option value="manager">Manager</option>
            </select>
          </Field>
          <Field label="Libellé"><input className="field" value={f.label} onChange={(e) => set('label', e.target.value)} /></Field>
          <Field label="Min (FCFA)"><input className="field" type="number" min={0} value={f.minAmount} onChange={(e) => set('minAmount', e.target.value)} placeholder="6000000" /></Field>
          <Field label="Médian (FCFA)"><input className="field" type="number" min={0} value={f.midAmount} onChange={(e) => set('midAmount', e.target.value)} placeholder="7500000" /></Field>
          <Field label="Max (FCFA)"><input className="field" type="number" min={0} value={f.maxAmount} onChange={(e) => set('maxAmount', e.target.value)} placeholder="9000000" /></Field>
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted-2)', marginTop: 6 }}>Montants annuels bruts. Ordre requis : min ≤ médian ≤ max.</div>
        {err && <div className="ferr" role="alert">{err}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="btn btn-primary" disabled={upsert.isPending} onClick={submit}>{upsert.isPending ? 'Enregistrement…' : 'Enregistrer la bande'}</button>
          <button className="btn btn-ghost" onClick={onDone}>Annuler</button>
        </div>
      </div>
    </div>
  );
}
