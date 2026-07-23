import { useState } from 'react';
import { CreateSurveyInput, DEFAULT_PULSE_QUESTIONS } from '@/types';
import { Field } from '@/components/mq';
import { useCreateSurvey } from './useEngagement';

// Slug simple pour dériver une clé de question stable depuis son libellé.
// Les caractères accentués (hors a-z0-9) deviennent des « _ » — suffisant pour une clé.
const slug = (s: string, i: number) =>
  (s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || `q${i}`).slice(0, 24);

export function NewSurveyForm({ onDone }: { onDone: () => void }) {
  const create = useCreateSurvey();
  const [title, setTitle] = useState('Enquête pulse');
  const [lines, setLines] = useState(DEFAULT_PULSE_QUESTIONS.map((q) => q.label).join('\n'));
  const [err, setErr] = useState<string | null>(null);

  const submit = () => {
    setErr(null);
    const labels = lines.split('\n').map((l) => l.trim()).filter(Boolean);
    const seen = new Set<string>();
    const questions = labels.map((label, i) => {
      let key = slug(label, i);
      while (seen.has(key)) key = `${key}_${i}`;
      seen.add(key);
      return { key, label };
    });
    const parsed = CreateSurveyInput.safeParse({ title, questions });
    if (!parsed.success) { setErr(parsed.error.issues[0]?.message ?? 'Champs invalides.'); return; }
    create.mutate(parsed.data, {
      onSuccess: () => onDone(),
      onError: (e) => setErr((e as Error).message || 'Échec de la création.'),
    });
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-head"><h3>Nouvelle enquête pulse</h3></div>
      <div className="card-pad">
        <Field label="Titre"><input className="field" value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        <Field label="Questions (une par ligne, notées de 1 à 5)" style={{ marginTop: 12 }}>
          <textarea className="field" rows={6} value={lines} onChange={(e) => setLines(e.target.value)} />
        </Field>
        {err && <div className="ferr" role="alert">{err}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button className="btn btn-primary" disabled={create.isPending} onClick={submit}>{create.isPending ? 'Création…' : 'Créer l’enquête'}</button>
          <button className="btn btn-ghost" onClick={onDone}>Annuler</button>
        </div>
      </div>
    </div>
  );
}
