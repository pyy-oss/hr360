import { useState } from 'react';
import { TL, ErrBar } from '@/components/mq';
import { useDirectory, type EmployeeRow } from '@/modules/collaborateurs/useCollaborateurs';
import { useSeedDemo } from '@/modules/absences/useLeave';
import { useAuth } from '@/auth/AuthProvider';
import { NewEmployeeForm } from './NewEmployeeForm';
import { DepartmentsCard } from '@/modules/collaborateurs/DepartmentsCard';

function statusChip(status: string) {
  if (status === 'confirme') return <span className="chip on">Confirmé</span>;
  if (status === 'sortant') return <span className="chip" style={{ background: 'var(--low-soft)', color: 'var(--low)', border: 'none' }}>Sortant</span>;
  return <span className="chip" style={{ background: 'var(--mid-soft)', color: 'var(--mid)', border: 'none' }}>Période d'essai</span>;
}
const initials = (e: EmployeeRow) => ((e.firstName?.[0] ?? '') + (e.lastName?.[0] ?? '')).toUpperCase() || '—';

export function CollaborateursPage() {
  const { role } = useAuth();
  const dir = useDirectory();
  const seed = useSeedDemo();
  const employees = dir.data ?? [];
  const [selId, setSelId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const selected = employees.find((e) => e.id === selId) ?? employees[0];
  const isSuperAdmin = role === 'super_admin';
  const canCreate = ['super_admin', 'drh', 'rh'].includes(role ?? '');

  return (
    <>
      <div className="page-head" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1>Collaborateurs</h1>
          <p>L'annuaire et le dossier de chaque salarié — la base unique de la donnée RH, alimentée dès l'embauche sans ressaisie.</p>
          <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>Module #26 · données réelles</span>
        </div>
        {canCreate && !showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14" /></svg>Nouveau collaborateur
          </button>
        )}
      </div>

      {showForm && <NewEmployeeForm onDone={() => setShowForm(false)} />}

      <ErrBar error={dir.error} prefix="Chargement de l'annuaire impossible." />

      {!dir.isLoading && employees.length === 0 && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
          <div>Aucun collaborateur enregistré.{isSuperAdmin && <> <button className="btn btn-primary" style={{ padding: '4px 10px', marginLeft: 8 }} disabled={seed.isPending} onClick={() => seed.mutate()}>{seed.isPending ? 'Chargement…' : 'Charger des données de démo'}</button></>}</div>
        </div>
      )}

      <div className="grid g2">
        <div className="card">
          <div className="card-head"><h3>Annuaire</h3><span className="sub">{employees.length} collaborateur{employees.length > 1 ? 's' : ''}</span></div>
          {dir.isLoading && <div className="card-pad" style={{ fontSize: 13, color: 'var(--muted)' }}>Chargement…</div>}
          {employees.map((e) => (
            <div key={e.id} className="cand" onClick={() => setSelId(e.id)}>
              <div className="c-av" style={{ background: 'var(--signal-deep)', color: '#fff' }}>{initials(e)}</div>
              <div style={{ flex: 1 }}><div className="c-name">{e.firstName} {e.lastName}</div><div className="c-meta">{e.jobTitle}{e.departmentId ? ` · ${e.departmentId}` : ''}</div></div>
              {statusChip(e.status)}
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-head"><h3>Dossier salarié</h3><span className="sub">{selected ? `${selected.firstName} ${selected.lastName}` : '—'}</span></div>
          <div className="card-pad">
            {!selected && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Sélectionne un collaborateur dans l'annuaire.</div>}
            {selected && (
              <>
                <div className="section-t" style={{ marginTop: 0 }}>Informations</div>
                <div className="ref-row"><span>Poste</span><span className="ref-w" style={{ fontFamily: 'Inter', fontWeight: 500 }}>{selected.jobTitle}</span></div>
                <div className="ref-row"><span>Département</span><span className="ref-w" style={{ fontFamily: 'Inter', fontWeight: 500 }}>{selected.departmentId}</span></div>
                <div className="ref-row" style={{ border: 'none' }}><span>Statut</span>{statusChip(selected.status)}</div>
                <div className="section-t">Historique</div>
                <TL items={[
                  { dot: 'done', title: 'Recrutement & embauche', sub: 'dossier créé' },
                  { dot: selected.status === 'essai' ? '' : 'done', title: "Période d'essai", sub: selected.status === 'essai' ? 'en cours' : 'confirmée' },
                ]} />
              </>
            )}
          </div>
        </div>
      </div>

      <DepartmentsCard />
    </>
  );
}
