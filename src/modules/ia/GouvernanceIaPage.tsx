import { Link } from 'react-router-dom';
import { ErrBar } from '@/components/mq';
import { useAiInvocations } from './useAi';

const CHECK = <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="var(--high)" strokeWidth={2}><path d="M20 6 9 17l-5-5" /></svg>;

const FEATURE_LABEL: Record<string, string> = {
  assistant: 'Assistant RH', scoring: 'Scoring candidat', generation: 'Génération de contenu',
  prediction: 'Prédiction', knowledge: 'Base de connaissances',
};

function InvocationsCard() {
  const inv = useAiInvocations();
  const rows = inv.data ?? [];
  const totalTokens = rows.reduce((s, r) => s + (r.inputTokens ?? 0) + (r.outputTokens ?? 0), 0);
  const errors = rows.filter((r) => !r.ok).length;

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-head"><h3>Journal des appels IA</h3><span className="sub">{rows.length} appels récents · {totalTokens.toLocaleString('fr-FR')} tokens{errors ? ` · ${errors} en échec` : ''}</span></div>
      <div className="card-pad">
        <ErrBar error={inv.error} prefix="Journal indisponible." />
        {inv.isLoading && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Chargement…</div>}
        {!inv.isLoading && rows.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Aucun appel IA journalisé pour l'instant.</div>}
        {rows.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="grille-table">
              <thead><tr><th>Fonction</th><th>Modèle</th><th>Rôle</th><th style={{ textAlign: 'right' }}>Tokens</th><th style={{ textAlign: 'right' }}>Latence</th><th style={{ textAlign: 'right' }}>Statut</th></tr></thead>
              <tbody>
                {rows.slice(0, 25).map((r) => (
                  <tr key={r.id}>
                    <td><b>{FEATURE_LABEL[r.feature] ?? r.feature}</b></td>
                    <td className="mono" style={{ fontSize: 11 }}>{r.model}</td>
                    <td>{r.actorRole ?? '—'}</td>
                    <td style={{ textAlign: 'right' }} className="mono">{((r.inputTokens ?? 0) + (r.outputTokens ?? 0)) || '—'}</td>
                    <td style={{ textAlign: 'right' }} className="mono">{r.latencyMs ? `${r.latencyMs} ms` : '—'}</td>
                    <td style={{ textAlign: 'right' }}>{r.ok ? <span className="chip on">OK</span> : <span className="chip" style={{ background: 'var(--low-soft)', color: 'var(--low)', border: 'none' }}>Échec</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="note" style={{ marginTop: 12 }}>{CHECK}<span>Minimisation : ni le prompt ni la réponse ne sont journalisés — seulement les métadonnées (qui, quoi, coût, latence).</span></div>
      </div>
    </div>
  );
}

const REGISTRY: { model: string; usage: string; version: string; sup: JSX.Element }[] = [
  { model: 'Scoring de conformité', usage: 'tri des CV', version: 'v3.2', sup: <span className="chip on">Humain requis</span> },
  { model: 'Prédiction attrition', usage: 'rétention', version: 'v1.4', sup: <span className="chip on">Humain requis</span> },
  { model: 'Génération de contenu', usage: 'studio IA', version: 'v2.0', sup: <span className="chip on">Relecture requise</span> },
  { model: 'Base de connaissances', usage: 'RAG cité', version: 'v1.1', sup: <span className="chip">Sources vérifiables</span> },
];
const SUPERVISION = [
  ['Validation humaine des décisions à impact', 'Aucune décision RH défavorable prise automatiquement.'],
  ['Explicabilité systématique', 'Chaque sortie IA accompagnée de son « pourquoi ».'],
  ['Garde-fou anti-hallucination', 'Réponses ancrées dans les sources, sinon abstention.'],
];
const COMPLIANCE = [
  'Données hébergées et traitées en interne (ARTCI)',
  "Journal d'audit des décisions IA",
  'Droit à une révision humaine pour le candidat',
];

export function GouvernanceIaPage() {
  return (
    <>
      <div className="page-head">
        <h1>Gouvernance de l'IA</h1>
        <p>La couche qui rend toute l'IA responsable et pilotable : registre des modèles, supervision humaine, explicabilité et conformité.</p>
        <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>Module IA #44 · données réelles</span>
      </div>

      <InvocationsCard />

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head"><h3>Registre des modèles IA</h3><span className="sub">versions &amp; usages</span></div>
        <table className="grille-table">
          <thead><tr><th>Modèle</th><th>Usage</th><th>Version</th><th style={{ textAlign: 'right' }}>Supervision</th></tr></thead>
          <tbody>
            {REGISTRY.map((r) => (
              <tr key={r.model}><td><b>{r.model}</b></td><td>{r.usage}</td><td className="mono">{r.version}</td><td style={{ textAlign: 'right' }}>{r.sup}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid g2">
        <div className="card">
          <div className="card-head"><h3>Supervision humaine (human-in-the-loop)</h3></div>
          <div className="card-pad">
            {SUPERVISION.map(([t, s]) => (
              <div key={t} className="setting"><div className="st-txt"><b>{t}</b><p>{s}</p></div><div className="tog on" /></div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Conformité &amp; contrôle des biais</h3></div>
          <div className="card-pad">
            <div className="alert alert-ok" style={{ marginBottom: 14, fontSize: 12 }}>{CHECK}<div>Surveillance des biais active sur tous les modèles de décision.</div></div>
            {COMPLIANCE.map((c, i) => (
              <div key={c} className="ref-row" style={i === COMPLIANCE.length - 1 ? { border: 'none' } : undefined}>{CHECK}<span>{c}</span></div>
            ))}
            <Link to="/equite" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}>Voir le tableau d'équité</Link>
          </div>
        </div>
      </div>
    </>
  );
}
