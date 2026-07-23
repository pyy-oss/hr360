import { useState } from 'react';
import { CandidateInput } from '@/types';
import { Field } from '@/components/mq';
import { useUpsertCandidate, usePositions } from './useRecrutement';
import { useDepartments } from '@/modules/collaborateurs/useCollaborateurs';

export function NewCandidateForm({ onDone }: { onDone: () => void }) {
  const upsert = useUpsertCandidate();
  const positions = usePositions();
  const depts = useDepartments();
  const [f, setF] = useState({
    firstName: '', lastName: '', email: '', phone: '', source: 'spontanee',
    positionId: '', departmentId: '', yearsExperience: '', matchScore: '',
  });
  const [err, setErr] = useState<string | null>(null);
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  // Sélectionner un poste renseigne automatiquement le département cible.
  const onPosition = (id: string) => {
    const pos = (positions.data ?? []).find((p) => p.id === id);
    setF((s) => ({ ...s, positionId: id, departmentId: pos?.departmentId ?? s.departmentId }));
  };

  const submit = () => {
    setErr(null);
    const parsed = CandidateInput.safeParse({
      firstName: f.firstName, lastName: f.lastName, email: f.email,
      phone: f.phone || undefined, source: f.source,
      positionId: f.positionId || undefined, departmentId: f.departmentId || undefined,
      yearsExperience: f.yearsExperience ? Number(f.yearsExperience) : 0,
      matchScore: f.matchScore ? Number(f.matchScore) : undefined,
      stage: 'nouveau',
    });
    if (!parsed.success) { setErr(parsed.error.issues[0]?.message ?? 'Champs invalides.'); return; }
    upsert.mutate(parsed.data, {
      onSuccess: () => onDone(),
      onError: (e) => setErr((e as Error).message || 'Échec de l’enregistrement.'),
    });
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-head"><h3>Nouveau candidat</h3></div>
      <div className="card-pad">
        <div className="form-grid">
          <Field label="Prénom"><input className="field" value={f.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="Salif" /></Field>
          <Field label="Nom"><input className="field" value={f.lastName} onChange={(e) => set('lastName', e.target.value)} placeholder="Guéï" /></Field>
          <Field label="Email"><input className="field" type="email" value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="candidat@example.ci" /></Field>
          <Field label="Téléphone (optionnel)"><input className="field" value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+225…" /></Field>
          <Field label="Source">
            <select className="field" value={f.source} onChange={(e) => set('source', e.target.value)}>
              <option value="spontanee">Candidature spontanée</option><option value="site">Site carrières</option>
              <option value="cooptation">Cooptation</option><option value="linkedin">LinkedIn</option>
              <option value="cabinet">Cabinet</option><option value="autre">Autre</option>
            </select>
          </Field>
          <Field label="Poste visé (optionnel)">
            <select className="field" value={f.positionId} onChange={(e) => onPosition(e.target.value)}>
              <option value="">— vivier (aucun poste) —</option>
              {(positions.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </Field>
          <Field label="Département cible">
            <select className="field" value={f.departmentId} onChange={(e) => set('departmentId', e.target.value)}>
              <option value="">— choisir —</option>
              {(depts.data ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
          <Field label="Années d'expérience"><input className="field" type="number" min={0} max={60} value={f.yearsExperience} onChange={(e) => set('yearsExperience', e.target.value)} placeholder="5" /></Field>
          <Field label="Score (0–100, saisi manuellement)" hint="Aucune IA en V2 — évaluation du recruteur."><input className="field" type="number" min={0} max={100} value={f.matchScore} onChange={(e) => set('matchScore', e.target.value)} placeholder="84" /></Field>
        </div>
        {err && <div className="ferr" role="alert">{err}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="btn btn-primary" disabled={upsert.isPending} onClick={submit}>{upsert.isPending ? 'Enregistrement…' : 'Ajouter au vivier'}</button>
          <button className="btn btn-ghost" onClick={onDone}>Annuler</button>
        </div>
      </div>
    </div>
  );
}
