import { useState } from 'react';
import { CompensationInput } from '@/types';
import { Field } from '@/components/mq';
import { useSetCompensation, useSalaryBands } from './useRemuneration';
import { useDirectory } from '@/modules/collaborateurs/useCollaborateurs';
import { money } from './money';

export function NewCompensationForm({ onDone }: { onDone: () => void }) {
  const setComp = useSetCompensation();
  const dir = useDirectory();
  const bands = useSalaryBands();
  const [f, setF] = useState({ employeeId: '', departmentId: '', bandLevel: 'confirme', baseSalary: '', effectiveDate: '', reason: '' });
  const [err, setErr] = useState<string | null>(null);
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  const onEmployee = (id: string) => {
    const emp = (dir.data ?? []).find((e) => e.id === id);
    setF((s) => ({ ...s, employeeId: id, departmentId: emp?.departmentId ?? '' }));
  };
  const band = (bands.data ?? []).find((b) => b.level === f.bandLevel);

  const submit = () => {
    setErr(null);
    const parsed = CompensationInput.safeParse({
      employeeId: f.employeeId, departmentId: f.departmentId, bandLevel: f.bandLevel,
      baseSalary: Number(f.baseSalary), effectiveDate: f.effectiveDate, reason: f.reason,
    });
    if (!parsed.success) { setErr(parsed.error.issues[0]?.message ?? 'Champs invalides.'); return; }
    setComp.mutate(parsed.data, {
      onSuccess: () => onDone(),
      onError: (e) => setErr((e as Error).message || 'Échec de l’enregistrement.'),
    });
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-head"><h3>Fixer / ajuster une rémunération</h3><span className="sub">journalisé (audit ARTCI)</span></div>
      <div className="card-pad">
        <div className="form-grid">
          <Field label="Collaborateur">
            <select className="field" value={f.employeeId} onChange={(e) => onEmployee(e.target.value)}>
              <option value="">— choisir —</option>
              {(dir.data ?? []).map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
            </select>
          </Field>
          <Field label="Palier">
            <select className="field" value={f.bandLevel} onChange={(e) => set('bandLevel', e.target.value)}>
              <option value="junior">Junior</option><option value="confirme">Confirmé</option>
              <option value="senior">Senior</option><option value="lead">Lead</option><option value="manager">Manager</option>
            </select>
          </Field>
          <Field label="Salaire annuel brut (FCFA)" hint={band ? `Bande ${band.label} : ${money(band.minAmount)} – ${money(band.maxAmount)}` : undefined}>
            <input className="field" type="number" min={0} value={f.baseSalary} onChange={(e) => set('baseSalary', e.target.value)} placeholder="9000000" />
          </Field>
          <Field label="Date d'effet"><input className="field" type="date" value={f.effectiveDate} onChange={(e) => set('effectiveDate', e.target.value)} /></Field>
          <Field label="Motif" style={{ gridColumn: '1 / -1' }}><input className="field" value={f.reason} onChange={(e) => set('reason', e.target.value)} placeholder="Embauche, revue annuelle, promotion…" /></Field>
        </div>
        {err && <div className="ferr" role="alert">{err}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="btn btn-primary" disabled={setComp.isPending} onClick={submit}>{setComp.isPending ? 'Enregistrement…' : 'Enregistrer'}</button>
          <button className="btn btn-ghost" onClick={onDone}>Annuler</button>
        </div>
      </div>
    </div>
  );
}
