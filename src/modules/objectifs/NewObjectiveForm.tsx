import { useState } from 'react';
import { ObjectiveInput } from '@/types';
import { Field } from '@/components/mq';
import { useUpsertObjective } from './useObjectifs';
import { useDirectory } from '@/modules/collaborateurs/useCollaborateurs';

export function NewObjectiveForm({ campaignId, onDone }: { campaignId: string; onDone: () => void }) {
  const upsert = useUpsertObjective();
  const dir = useDirectory();
  const [f, setF] = useState({ employeeId: '', departmentId: '', title: '', measure: '', weight: '' });
  const [err, setErr] = useState<string | null>(null);
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  // Choisir le collaborateur renseigne son département.
  const onEmployee = (id: string) => {
    const emp = (dir.data ?? []).find((e) => e.id === id);
    setF((s) => ({ ...s, employeeId: id, departmentId: emp?.departmentId ?? '' }));
  };

  const submit = () => {
    setErr(null);
    const parsed = ObjectiveInput.safeParse({
      campaignId, employeeId: f.employeeId, departmentId: f.departmentId,
      title: f.title, measure: f.measure, weight: Number(f.weight),
    });
    if (!parsed.success) { setErr(parsed.error.issues[0]?.message ?? 'Champs invalides.'); return; }
    upsert.mutate(parsed.data, {
      onSuccess: () => onDone(),
      onError: (e) => setErr((e as Error).message || 'Échec de l’enregistrement.'),
    });
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-head"><h3>Nouvel objectif</h3><span className="sub">brouillon — à valider par le manager</span></div>
      <div className="card-pad">
        <div className="form-grid">
          <Field label="Collaborateur">
            <select className="field" value={f.employeeId} onChange={(e) => onEmployee(e.target.value)}>
              <option value="">— choisir —</option>
              {(dir.data ?? []).map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
            </select>
          </Field>
          <Field label="Pondération %"><input className="field" type="number" min={0} max={100} value={f.weight} onChange={(e) => set('weight', e.target.value)} placeholder="25" /></Field>
          <Field label="Intitulé" style={{ gridColumn: '1 / -1' }}><input className="field" value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="Réduire le délai moyen d'audit" /></Field>
          <Field label="Mesure / indicateur" style={{ gridColumn: '1 / -1' }}><input className="field" value={f.measure} onChange={(e) => set('measure', e.target.value)} placeholder="Délai moyen ≤ 15 jours ouvrés" /></Field>
        </div>
        {err && <div className="ferr" role="alert">{err}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="btn btn-primary" disabled={upsert.isPending} onClick={submit}>{upsert.isPending ? 'Enregistrement…' : 'Créer l’objectif'}</button>
          <button className="btn btn-ghost" onClick={onDone}>Annuler</button>
        </div>
      </div>
    </div>
  );
}
