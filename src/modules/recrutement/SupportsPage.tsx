import { useState } from 'react';
import { ErrBar, Field } from '@/components/mq';
import { useAuth } from '@/auth/AuthProvider';
import { usePositions } from './useRecrutement';
import { useGenerateContent, type GenerationKind } from '@/modules/ia/useAi';

const KINDS: { value: Extract<GenerationKind, 'fiche_poste' | 'compte_rendu'>; label: string; hint: string }[] = [
  { value: 'fiche_poste', label: "Trame d'entretien (fiche de poste)", hint: 'Structure les compétences attendues en points à explorer.' },
  { value: 'compte_rendu', label: "Grille de compte rendu", hint: 'Cadre de restitution à remplir après l\'entretien.' },
];

export function SupportsPage() {
  const { role } = useAuth();
  const positions = usePositions();
  const generate = useGenerateContent();
  const [positionId, setPositionId] = useState('');
  const [kind, setKind] = useState<'fiche_poste' | 'compte_rendu'>('fiche_poste');
  const [brief, setBrief] = useState('');

  const canGenerate = ['super_admin', 'drh', 'rh', 'manager'].includes(role ?? '');
  const draft = generate.data;

  if (!canGenerate) {
    return (
      <>
        <div className="page-head"><h1>Supports d'entretien</h1></div>
        <div className="alert alert-info">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
          <div>Cet écran est réservé aux équipes RH, DRH et managers.</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-head">
        <h1>Supports d'entretien</h1>
        <p>Générez une trame d'entretien ou une grille de compte rendu à partir d'un poste ouvert. Le brouillon reste à relire et à ajuster avant utilisation.</p>
      </div>

      <ErrBar error={positions.error} prefix="Chargement des postes impossible." />

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head"><h3>Générer un support</h3><span className="feat">Claude · brouillon</span></div>
        <div className="card-pad">
          <div className="form-grid">
            <Field label="Poste">
              <select className="field" value={positionId} onChange={(e) => setPositionId(e.target.value)}>
                <option value="">— choisir un poste —</option>
                {(positions.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </Field>
            <Field label="Type de support" hint={KINDS.find((k) => k.value === kind)?.hint}>
              <select className="field" value={kind} onChange={(e) => setKind(e.target.value as 'fiche_poste' | 'compte_rendu')}>
                {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Précisions (optionnel)" style={{ marginTop: 4 }}>
            <textarea className="field" rows={3} value={brief} onChange={(e) => setBrief(e.target.value)}
              placeholder="Ex. insister sur la conformité ISO 27001 et la posture conseil." />
          </Field>

          <ErrBar error={generate.error} prefix="Génération indisponible." />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
            <button className="btn btn-primary" disabled={!positionId || generate.isPending}
              onClick={() => generate.mutate({ kind, positionId, brief: brief || undefined })}>
              {generate.isPending ? 'Génération…' : 'Générer le support'}
            </button>
            <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>Contenu généré — à valider par un humain.</span>
          </div>
        </div>
      </div>

      {draft && (
        <div className="card">
          <div className="card-head">
            <h3>{KINDS.find((k) => k.value === kind)?.label}</h3>
            <span className="chip" style={{ marginLeft: 'auto', background: 'var(--mid-soft)', color: 'var(--mid)', border: 'none' }}>Brouillon à valider</span>
          </div>
          <div className="card-pad">
            <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.6 }}>{draft}</div>
            <div className="note" style={{ marginTop: 14 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              Brouillon assisté par IA (human-in-the-loop) : relisez et ajustez avant de le diffuser au jury. Génération journalisée (gouvernance).
            </div>
          </div>
        </div>
      )}
    </>
  );
}
