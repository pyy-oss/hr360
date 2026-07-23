import { useState } from 'react';
import { ErrBar } from '@/components/mq';
import { useAuth } from '@/auth/AuthProvider';
import { useDepartments, useUpsertDepartment } from './useCollaborateurs';

export function DepartmentsCard() {
  const { role } = useAuth();
  const depts = useDepartments();
  const upsert = useUpsertDepartment();
  const canManage = ['super_admin', 'drh'].includes(role ?? '');

  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const rows = depts.data ?? [];

  const create = () => {
    setErr(null);
    if (!newName.trim()) { setErr('Nom requis.'); return; }
    upsert.mutate({ name: newName.trim() }, {
      onSuccess: () => setNewName(''),
      onError: (e) => setErr((e as Error).message || 'Échec.'),
    });
  };
  const rename = (id: string) => {
    setErr(null);
    if (!editName.trim()) { setErr('Nom requis.'); return; }
    upsert.mutate({ id, name: editName.trim() }, {
      onSuccess: () => setEditId(null),
      onError: (e) => setErr((e as Error).message || 'Échec.'),
    });
  };

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="card-head"><h3>Départements</h3><span className="sub">{rows.length}</span></div>
      <div className="card-pad">
        <ErrBar error={depts.error} prefix="Chargement des départements impossible." />
        {depts.isLoading && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Chargement…</div>}
        {!depts.isLoading && rows.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Aucun département.</div>}

        {rows.map((d, i) => (
          <div key={d.id} className="ref-row" style={i === rows.length - 1 ? { border: 'none' } : undefined}>
            {editId === d.id ? (
              <div style={{ display: 'flex', gap: 8, width: '100%', alignItems: 'center' }}>
                <input className="field" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ flex: 1 }} aria-label="Nom du département" />
                <button className="btn btn-primary" style={{ padding: '4px 10px' }} disabled={upsert.isPending} onClick={() => rename(d.id)}>Enregistrer</button>
                <button className="btn btn-ghost" style={{ padding: '4px 10px' }} onClick={() => setEditId(null)}>Annuler</button>
              </div>
            ) : (
              <>
                <b style={{ fontSize: 13 }}>{d.name}</b>
                {canManage && (
                  <button className="btn btn-ghost" style={{ marginLeft: 'auto', padding: '4px 10px' }} onClick={() => { setEditId(d.id); setEditName(d.name); setErr(null); }}>Renommer</button>
                )}
              </>
            )}
          </div>
        ))}

        {canManage && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
            <input className="field" placeholder="Nouveau département…" value={newName} onChange={(e) => setNewName(e.target.value)} style={{ flex: 1 }} aria-label="Nouveau département" />
            <button className="btn btn-primary" disabled={upsert.isPending} onClick={create}>{upsert.isPending ? '…' : 'Ajouter'}</button>
          </div>
        )}
        {err && <div className="ferr" role="alert">{err}</div>}
      </div>
    </div>
  );
}
