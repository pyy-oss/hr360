import { useState } from 'react';
import { MissionInput } from '@/types';
import { useUpsertMission } from '@/modules/staffing/useStaffing';
import { useDepartments } from '@/modules/collaborateurs/useCollaborateurs';

export function NewMissionForm({ onDone }: { onDone: () => void }) {
  const upsert = useUpsertMission();
  const depts = useDepartments();
  const [f, setF] = useState({ name: '', client: '', departmentId: '', startDate: '', endDate: '', status: 'prospect' });
  const [err, setErr] = useState<string | null>(null);
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  const submit = () => {
    setErr(null);
    const parsed = MissionInput.safeParse({ ...f, endDate: f.endDate || undefined });
    if (!parsed.success) { setErr(parsed.error.issues[0]?.message ?? 'Champs invalides.'); return; }
    upsert.mutate(parsed.data, {
      onSuccess: () => onDone(),
      onError: (e) => setErr((e as Error).message || 'Échec de l’enregistrement.'),
    });
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-head"><h3>Nouvelle mission</h3></div>
      <div className="card-pad">
        <div className="form-grid">
          <div><label className="flabel">Intitulé</label><input className="field" value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Audit sécurité…" /></div>
          <div><label className="flabel">Client</label><input className="field" value={f.client} onChange={(e) => set('client', e.target.value)} placeholder="Banque régionale" /></div>
          <div>
            <label className="flabel">Département</label>
            <select className="field" value={f.departmentId} onChange={(e) => set('departmentId', e.target.value)}>
              <option value="">— choisir —</option>
              {(depts.data ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="flabel">Statut</label>
            <select className="field" value={f.status} onChange={(e) => set('status', e.target.value)}>
              <option value="prospect">Prospect</option><option value="active">Active</option>
              <option value="suspendue">Suspendue</option><option value="terminee">Terminée</option>
            </select>
          </div>
          <div><label className="flabel">Début</label><input className="field" type="date" value={f.startDate} onChange={(e) => set('startDate', e.target.value)} /></div>
          <div><label className="flabel">Fin (optionnel)</label><input className="field" type="date" value={f.endDate} onChange={(e) => set('endDate', e.target.value)} /></div>
        </div>
        {err && <div className="ferr">{err}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="btn btn-primary" disabled={upsert.isPending} onClick={submit}>{upsert.isPending ? 'Enregistrement…' : 'Créer la mission'}</button>
          <button className="btn btn-ghost" onClick={onDone}>Annuler</button>
        </div>
      </div>
    </div>
  );
}
