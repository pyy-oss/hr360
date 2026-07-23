type Col = { av: string; name: string; tag: string; score: string; win?: boolean; rows: [string, number, string][] };
const COLS: Col[] = [
  { av: 'AK', name: 'Aïcha Koné', tag: 'Recommandé', score: '89', win: true, rows: [['Technique', 90, 'var(--signal-deep)'], ['Expérience', 86, '#2C5468'], ['Soft', 82, 'var(--gold)']] },
  { av: 'MD', name: 'Mamadou Diallo', tag: 'Recommandé', score: '82', rows: [['Technique', 84, 'var(--signal-deep)'], ['Expérience', 82, '#2C5468'], ['Soft', 78, 'var(--gold)']] },
  { av: 'FB', name: 'Fatou Bamba', tag: 'Shortlist', score: '76', rows: [['Technique', 70, 'var(--signal-deep)'], ['Expérience', 74, '#2C5468'], ['Soft', 86, 'var(--gold)']] },
];

const OFFER = [
  ['Poste', 'Consultant Cybersécurité — Confirmé'],
  ['Niveau / palier', 'Palier 4'],
  ['Rémunération', 'Selon grille interne'],
  ['Démarrage proposé', 'Dès accord'],
];

export function DecisionPage() {
  return (
    <>
      <div className="page-head">
        <h1>Décision &amp; jury</h1>
        <p>Comparer les finalistes sur des bases homogènes, détecter les biais du jury, puis produire la décision et l'offre.</p>
      </div>

      <div className="alert alert-warn" style={{ marginBottom: 16 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>
        <div><b>Divergence jury détectée <span className="feat">#10</span></b> — sur Fatou Bamba, le Tech Lead note 2/5 et le Manager 5/5 en « posture conseil ». À discuter en réunion : symptôme possible d'un biais individuel.</div>
      </div>

      <div className="section-t" style={{ marginTop: 0 }}>Comparateur multi-candidats <span className="feat">#9</span></div>
      <div className="grid g3" style={{ marginBottom: 20 }}>
        {COLS.map((c) => (
          <div key={c.av} className={`cmp-col${c.win ? ' win' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div className="c-av" style={{ width: 34, height: 34 }}>{c.av}</div>
              <div><b style={{ fontSize: '13.5px' }}>{c.name}</b><div style={{ fontSize: 11, color: 'var(--muted-2)' }}>{c.tag}</div></div>
              <span className="score-badge sb-high" style={{ marginLeft: 'auto' }}>{c.score}</span>
            </div>
            {c.rows.map(([lab, v, bg]) => (
              <div key={lab} className="mini" style={{ padding: '6px 0' }}>
                <span className="m-lab" style={{ width: 90 }}>{lab}</span>
                <div className="m-track"><div className="mf" style={{ width: `${v}%`, background: bg }} /></div>
                <span className="m-val">{v}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="grid g2">
        <div className="card">
          <div className="card-head"><h3>Débrief consolidé</h3><span className="feat">#11</span></div>
          <div className="card-pad">
            <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: 12 }}>Synthèse des grilles du jury, alignée sur le référentiel.</div>
            <p style={{ fontSize: 13, lineHeight: 1.6 }}><b>Aïcha Koné</b> ressort en tête sur les axes techniques (pentest, conformité), point fort partagé par les trois membres du jury. Le seul écart concerne le travail en équipe, à confirmer lors de la période d'essai. Recommandation : <b>proposition d'embauche</b>, avec objectif d'intégration progressive dans une équipe encadrée.</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}><span className="chip on">Consensus jury : fort</span><span className="chip">Score final : 89</span></div>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Proposition d'embauche</h3><span className="feat">#12</span></div>
          <div className="card-pad">
            <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: 12 }}>Pré-remplie sur la grille salariale interne et le niveau évalué.</div>
            {OFFER.map(([k, v], i) => (
              <div key={k} className="ref-row" style={i === OFFER.length - 1 ? { border: 'none' } : undefined}>
                <span>{k}</span><span className="ref-w" style={{ fontFamily: 'Inter', fontWeight: 500 }}>{v}</span>
              </div>
            ))}
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /></svg>Générer la lettre d'offre
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
