import { useState } from 'react';
import { OffboardingStartInput } from '@/types';
import { Field } from '@/components/mq';
import { useStartOffboarding } from './useOffboarding';
import { useDirectory } from '@/modules/collaborateurs/useCollaborateurs';

export function NewOffboardingForm({ onDone }: { onDone: () => void }) {
  const start = useStartOffboarding();
  const dir = useDirectory();
  const [f, setF] = useState({ employeeId: '', departmentId: '', reason: 'demission', lastDay: '', notes: '' });
  const [err, setErr] = useState<string | null>(null);
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  const onEmployee = (id: string) => {
    const emp = (dir.data ?? []).find((e) => e.id === id);
    setF((s) => ({ ...s, employeeId: id, departmentId: emp?.departmentId ?? '' }));
  };

  const submit = () => {
    setErr(null);
    const parsed = OffboardingStartInput.safeParse({
      employeeId: f.employeeId, departmentId: f.departmentId, reason: f.reason,
      lastDay: f.lastDay, notes: f.notes || undefined,
    });
    if (!parsed.success) { setErr(parsed.error.issues[0]?.message ?? 'Champs invalides.'); return; }
    start.mutate(parsed.data, {
      onSuccess: () => onDone(),
      onError: (e) => setErr((e as Error).message || 'Échec du démarrage.'),
    });
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-head"><h3>Démarrer un offboarding</h3></div>
      <div className="card-pad">
        <div className="form-grid">
          <Field label="Collaborateur">
            <select className="field" value={f.employeeId} onChange={(e) => onEmployee(e.target.value)}>
              <option value="">— choisir —</option>
              {(dir.data ?? []).map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
            </select>
          </Field>
          <Field label="Motif du départ">
            <select className="field" value={f.reason} onChange={(e) => set('reason', e.target.value)}>
              <option value="demission">Démission</option>
              <option value="licenciement">Licenciement</option>
              <option value="fin_cdd">Fin de CDD</option>
              <option value="rupture_conventionnelle">Rupture conventionnelle</option>
              <option value="retraite">Retraite</option>
              <option value="autre">Autre</option>
            </select>
          </Field>
          <Field label="Dernier jour"><input className="field" type="date" value={f.lastDay} onChange={(e) => set('lastDay', e.target.value)} /></Field>
          <Field label="Notes (optionnel)" style={{ gridColumn: '1 / -1' }}><input className="field" value={f.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Contexte, passation…" /></Field>
        </div>
        {err && <div className="ferr" role="alert">{err}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="btn btn-primary" disabled={start.isPending} onClick={submit}>{start.isPending ? 'Démarrage…' : 'Démarrer'}</button>
          <button className="btn btn-ghost" onClick={onDone}>Annuler</button>
        </div>
      </div>
    </div>
  );
}
