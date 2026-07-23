import { useState } from 'react';
import { PositionInput } from '@/types';
import { Field } from '@/components/mq';
import { useUpsertPosition } from './useRecrutement';
import { useDepartments } from '@/modules/collaborateurs/useCollaborateurs';

const csv = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);

export function NewPositionForm({ onDone }: { onDone: () => void }) {
  const upsert = useUpsertPosition();
  const depts = useDepartments();
  const [f, setF] = useState({
    title: '', departmentId: '', level: 'confirme', contractType: 'cdi', openings: '1',
    status: 'ouvert', mustSkills: '', niceSkills: '', excludedCriteria: 'age, genre, origine, photo',
    wTech: '50', wExp: '25', wSoft: '15', wForm: '10',
  });
  const [err, setErr] = useState<string | null>(null);
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  const submit = () => {
    setErr(null);
    const parsed = PositionInput.safeParse({
      title: f.title, departmentId: f.departmentId, level: f.level, contractType: f.contractType,
      openings: Number(f.openings) || 1, status: f.status,
      mustSkills: csv(f.mustSkills), niceSkills: csv(f.niceSkills), excludedCriteria: csv(f.excludedCriteria),
      weights: { technique: Number(f.wTech), experience: Number(f.wExp), soft: Number(f.wSoft), formation: Number(f.wForm) },
    });
    if (!parsed.success) { setErr(parsed.error.issues[0]?.message ?? 'Champs invalides.'); return; }
    upsert.mutate(parsed.data, {
      onSuccess: () => onDone(),
      onError: (e) => setErr((e as Error).message || 'Échec de l’enregistrement.'),
    });
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-head"><h3>Nouveau poste</h3></div>
      <div className="card-pad">
        <div className="form-grid">
          <Field label="Intitulé" style={{ gridColumn: '1 / -1' }}><input className="field" value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="Consultant Cybersécurité — Confirmé" /></Field>
          <Field label="Département">
            <select className="field" value={f.departmentId} onChange={(e) => set('departmentId', e.target.value)}>
              <option value="">— choisir —</option>
              {(depts.data ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
          <Field label="Niveau">
            <select className="field" value={f.level} onChange={(e) => set('level', e.target.value)}>
              <option value="junior">Junior</option><option value="confirme">Confirmé</option>
              <option value="senior">Senior</option><option value="lead">Lead</option><option value="manager">Manager</option>
            </select>
          </Field>
          <Field label="Contrat">
            <select className="field" value={f.contractType} onChange={(e) => set('contractType', e.target.value)}>
              <option value="cdi">CDI</option><option value="cdd">CDD</option><option value="stage">Stage</option>
              <option value="alternance">Alternance</option><option value="prestation">Prestation</option>
            </select>
          </Field>
          <Field label="Postes à pourvoir"><input className="field" type="number" min={1} max={50} value={f.openings} onChange={(e) => set('openings', e.target.value)} /></Field>
          <Field label="Compétences éliminatoires (MUST, séparées par des virgules)" style={{ gridColumn: '1 / -1' }}><input className="field" value={f.mustSkills} onChange={(e) => set('mustSkills', e.target.value)} placeholder="Tests d'intrusion, ISO 27001…" /></Field>
          <Field label="Compétences valorisées (NICE)" style={{ gridColumn: '1 / -1' }}><input className="field" value={f.niceSkills} onChange={(e) => set('niceSkills', e.target.value)} placeholder="SIEM, OSCP…" /></Field>
          <Field label="Critères exclus du scoring (audit ARTCI)" style={{ gridColumn: '1 / -1' }}><input className="field" value={f.excludedCriteria} onChange={(e) => set('excludedCriteria', e.target.value)} /></Field>
          <Field label="Pond. Technique %"><input className="field" type="number" value={f.wTech} onChange={(e) => set('wTech', e.target.value)} /></Field>
          <Field label="Pond. Expérience %"><input className="field" type="number" value={f.wExp} onChange={(e) => set('wExp', e.target.value)} /></Field>
          <Field label="Pond. Soft %"><input className="field" type="number" value={f.wSoft} onChange={(e) => set('wSoft', e.target.value)} /></Field>
          <Field label="Pond. Formation %"><input className="field" type="number" value={f.wForm} onChange={(e) => set('wForm', e.target.value)} /></Field>
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted-2)', marginTop: 6 }}>La somme des pondérations doit valoir 100 %.</div>
        {err && <div className="ferr" role="alert">{err}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="btn btn-primary" disabled={upsert.isPending} onClick={submit}>{upsert.isPending ? 'Enregistrement…' : 'Créer le poste'}</button>
          <button className="btn btn-ghost" onClick={onDone}>Annuler</button>
        </div>
      </div>
    </div>
  );
}
