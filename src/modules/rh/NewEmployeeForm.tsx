import { useState } from 'react';
import { EmployeeInput } from '@/types';
import { Field } from '@/components/mq';
import { useUpsertEmployee, useDepartments } from '@/modules/collaborateurs/useCollaborateurs';

export function NewEmployeeForm({ onDone }: { onDone: () => void }) {
  const upsert = useUpsertEmployee();
  const depts = useDepartments();
  const [f, setF] = useState({
    firstName: '', lastName: '', email: '', departmentId: '', jobTitle: '',
    seniorityLevel: 'confirme', contractType: 'cdi', hireDate: '', status: 'essai',
  });
  const [err, setErr] = useState<string | null>(null);
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  const submit = () => {
    setErr(null);
    const parsed = EmployeeInput.safeParse(f);
    if (!parsed.success) { setErr(parsed.error.issues[0]?.message ?? 'Champs invalides.'); return; }
    upsert.mutate(parsed.data, {
      onSuccess: () => onDone(),
      onError: (e) => setErr((e as Error).message || 'Échec de l’enregistrement.'),
    });
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-head"><h3>Nouveau collaborateur</h3></div>
      <div className="card-pad">
        <div className="form-grid">
          <Field label="Prénom"><input className="field" value={f.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="Awa" /></Field>
          <Field label="Nom"><input className="field" value={f.lastName} onChange={(e) => set('lastName', e.target.value)} placeholder="Koné" /></Field>
          <Field label="Email professionnel"><input className="field" type="email" value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="a.kone@neurones.ci" /></Field>
          <Field label="Département">
            <select className="field" value={f.departmentId} onChange={(e) => set('departmentId', e.target.value)}>
              <option value="">— choisir —</option>
              {(depts.data ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
          <Field label="Poste"><input className="field" value={f.jobTitle} onChange={(e) => set('jobTitle', e.target.value)} placeholder="Consultant cybersécurité" /></Field>
          <Field label="Séniorité">
            <select className="field" value={f.seniorityLevel} onChange={(e) => set('seniorityLevel', e.target.value)}>
              <option value="junior">Junior</option><option value="confirme">Confirmé</option>
              <option value="senior">Senior</option><option value="lead">Lead</option><option value="manager">Manager</option>
            </select>
          </Field>
          <Field label="Type de contrat">
            <select className="field" value={f.contractType} onChange={(e) => set('contractType', e.target.value)}>
              <option value="cdi">CDI</option><option value="cdd">CDD</option><option value="stage">Stage</option>
              <option value="alternance">Alternance</option><option value="prestation">Prestation</option>
            </select>
          </Field>
          <Field label="Statut">
            <select className="field" value={f.status} onChange={(e) => set('status', e.target.value)}>
              <option value="essai">Période d'essai</option><option value="confirme">Confirmé</option><option value="sortant">Sortant</option>
            </select>
          </Field>
          <Field label="Date d'embauche"><input className="field" type="date" value={f.hireDate} onChange={(e) => set('hireDate', e.target.value)} /></Field>
        </div>
        {err && <div className="ferr" role="alert">{err}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="btn btn-primary" disabled={upsert.isPending} onClick={submit}>{upsert.isPending ? 'Enregistrement…' : 'Créer le dossier'}</button>
          <button className="btn btn-ghost" onClick={onDone}>Annuler</button>
        </div>
      </div>
    </div>
  );
}
