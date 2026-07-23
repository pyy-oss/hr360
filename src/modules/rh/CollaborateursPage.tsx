import { TL } from '@/components/mq';

const DOC_IC = <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="var(--muted)" strokeWidth={1.8}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /></svg>;

const ANNUAIRE = [
  { av: 'AK', avStyle: undefined as React.CSSProperties | undefined, name: 'Aïcha Koné', meta: 'Consultant Cybersécurité · 0,1 an', badge: <span className="chip" style={{ background: 'var(--mid-soft)', color: 'var(--mid)', border: 'none' }}>Période d'essai</span> },
  { av: 'SK', avStyle: { background: 'var(--signal-deep)', color: '#fff' }, name: 'S. K.', meta: 'Analyste SOC · Infra · 3 ans', badge: <span className="chip on">Confirmé</span> },
  { av: 'AT', avStyle: { background: 'var(--signal-deep)', color: '#fff' }, name: 'A. T.', meta: 'Consultant Réseau · Infra · 5 ans', badge: <span className="chip on">Confirmé</span> },
  { av: 'HB', avStyle: { background: 'var(--signal-deep)', color: '#fff' }, name: 'H. B.', meta: "Chargé d'audit · Conseil · 2 ans", badge: <span className="chip on">Confirmé</span> },
];
const DOCS: [string, JSX.Element][] = [
  ['Contrat de travail signé', <span className="chip on ref-w" style={{ marginLeft: 'auto' }}>À jour</span>],
  ['Pièces administratives & CNPS', <span className="chip on ref-w" style={{ marginLeft: 'auto' }}>Complet</span>],
  ['Attestations générées à la demande', <span className="chip ref-w" style={{ marginLeft: 'auto' }}>3 modèles</span>],
];

export function CollaborateursPage() {
  return (
    <>
      <div className="page-head">
        <h1>Collaborateurs</h1>
        <p>L'annuaire et le dossier de chaque salarié — la base unique de la donnée RH, alimentée dès l'embauche sans ressaisie.</p>
        <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>Module #26</span>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-pad" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="ci" style={{ flex: 1 }}>Rechercher un collaborateur, un département, une compétence…</div>
          <button className="btn btn-ghost">Filtrer</button>
        </div>
      </div>
      <div className="grid g2">
        <div className="card">
          <div className="card-head"><h3>Annuaire</h3><span className="sub">128 collaborateurs</span></div>
          {ANNUAIRE.map((c) => (
            <div key={c.name} className="cand">
              <div className="c-av" style={c.avStyle}>{c.av}</div>
              <div style={{ flex: 1 }}><div className="c-name">{c.name}</div><div className="c-meta">{c.meta}</div></div>
              {c.badge}
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-head"><h3>Dossier salarié</h3><span className="sub">Aïcha Koné</span></div>
          <div className="card-pad">
            <div className="section-t" style={{ marginTop: 0 }}>Documents</div>
            {DOCS.map(([label, chip], i) => (
              <div key={label} className="ref-row" style={i === DOCS.length - 1 ? { border: 'none' } : undefined}>{DOC_IC}<span>{label}</span>{chip}</div>
            ))}
            <div className="section-t">Historique</div>
            <TL items={[
              { dot: 'done', title: 'Recrutement & embauche', sub: 'issu du module recrutement' },
              { dot: '', title: "Période d'essai en cours", sub: 'échéance J90' },
            ]} />
          </div>
        </div>
      </div>
    </>
  );
}
