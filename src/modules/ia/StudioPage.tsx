import { ReactNode, useState } from 'react';
import { ErrBar, Field } from '@/components/mq';
import { useAuth } from '@/auth/AuthProvider';
import { usePositions } from '@/modules/recrutement/useRecrutement';
import { useGenerateContent, type GenerationKind } from './useAi';

const TOOLS: { kind: GenerationKind; icon: ReactNode; title: string; sub: string; usesPosition?: boolean }[] = [
  { kind: 'offre', icon: <path d="M20 7h-3V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />, title: "Offre d'emploi", sub: 'à partir du référentiel de poste', usesPosition: true },
  { kind: 'fiche_poste', icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /></>, title: 'Fiche de poste', sub: 'missions, compétences, niveau', usesPosition: true },
  { kind: 'compte_rendu', icon: <><path d="M4 4h16v16H4z" /><path d="M8 8h8M8 12h8M8 16h5" /></>, title: "Compte-rendu d'entretien", sub: 'à partir des notes du jury' },
  { kind: 'reponse_candidat', icon: <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />, title: 'Réponse candidat', sub: 'acceptation ou refus, avec tact' },
  { kind: 'communication', icon: <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />, title: 'Communication RH', sub: 'annonces internes, notes' },
  { kind: 'lettre_embauche', icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M9 15l2 2 4-4" /></>, title: "Lettre d'embauche", sub: 'variantes de ton' },
];

export function StudioPage() {
  const { role } = useAuth();
  const positions = usePositions();
  const gen = useGenerateContent();
  const [sel, setSel] = useState<GenerationKind>('offre');
  const [positionId, setPositionId] = useState('');
  const [brief, setBrief] = useState('');
  const [tone, setTone] = useState<'neutre' | 'chaleureux' | 'formel'>('neutre');
  const [copied, setCopied] = useState(false);

  const canGenerate = ['super_admin', 'drh', 'rh', 'manager'].includes(role ?? '');
  const tool = TOOLS.find((t) => t.kind === sel)!;

  const generate = () => {
    setCopied(false);
    gen.mutate({ kind: sel, positionId: tool.usesPosition && positionId ? positionId : undefined, brief: brief || undefined, tone });
  };

  return (
    <>
      <div className="page-head">
        <h1>Studio de génération</h1>
        <p>Un atelier de rédaction assistée : offres, fiches de poste, courriers, comptes-rendus et communications RH — générés en un instant, revus par un humain.</p>
        <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>Couche IA · Claude</span>
      </div>

      <div className="grid g3" style={{ marginBottom: 16 }}>
        {TOOLS.map((t) => (
          <div key={t.kind} className="card card-pad" style={{ cursor: 'pointer', borderColor: sel === t.kind ? 'var(--signal)' : undefined }}
            onClick={() => { setSel(t.kind); setCopied(false); }} role="button" aria-pressed={sel === t.kind}>
            <div className="k-ic" style={{ marginBottom: 10 }}><svg viewBox="0 0 24 24" width={17} height={17} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">{t.icon}</svg></div>
            <b style={{ fontSize: '13.5px' }}>{t.title}</b>
            <div style={{ fontSize: 12, color: 'var(--muted-2)', marginTop: 2 }}>{t.sub}</div>
          </div>
        ))}
      </div>

      {canGenerate && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-head"><h3>{tool.title}</h3><span className="feat">Claude · brouillon</span></div>
          <div className="card-pad">
            <div className="form-grid">
              {tool.usesPosition && (
                <Field label="Poste de référence (optionnel)">
                  <select className="field" value={positionId} onChange={(e) => setPositionId(e.target.value)}>
                    <option value="">— aucun —</option>
                    {(positions.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </Field>
              )}
              <Field label="Ton">
                <select className="field" value={tone} onChange={(e) => setTone(e.target.value as typeof tone)}>
                  <option value="neutre">Neutre</option><option value="chaleureux">Chaleureux</option><option value="formel">Formel</option>
                </select>
              </Field>
              <Field label="Éléments à intégrer (optionnel)" style={{ gridColumn: '1 / -1' }}>
                <textarea className="field" rows={3} value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="Notes du jury, contexte, points clés à mentionner…" />
              </Field>
            </div>
            <ErrBar error={gen.error} prefix="Génération indisponible." />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
              <button className="btn btn-primary" disabled={gen.isPending} onClick={generate}>{gen.isPending ? 'Génération…' : 'Générer le brouillon'}</button>
              {gen.data && (
                <button className="btn btn-ghost" onClick={() => { navigator.clipboard?.writeText(gen.data!); setCopied(true); }}>
                  {copied ? 'Copié ✓' : 'Copier'}
                </button>
              )}
            </div>

            {gen.data && (
              <div style={{ marginTop: 12, padding: 14, border: '1px solid var(--line)', borderRadius: 10, background: 'var(--surface)', whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.5 }}>
                {gen.data}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M12 2 2 7l10 5 10-5-10-5Z" /></svg>Tout contenu généré est un brouillon soumis à relecture humaine, en formulation inclusive. Rien n'est publié ni envoyé automatiquement. Chaque génération est journalisée (gouvernance).</div>
    </>
  );
}
