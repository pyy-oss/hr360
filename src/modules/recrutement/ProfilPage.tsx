const SOFT = [
  ['Posture conseil', 88, 'Confiance élevée'],
  ['Vulgarisation', 82, 'Confiance élevée'],
  ['Rigueur / traçabilité', 79, 'Confiance moy.'],
  ['Travail en équipe', 60, 'À vérifier'],
] as const;

export function ProfilPage() {
  return (
    <>
      <div className="page-head">
        <h1>Profil 360° — Aïcha Koné</h1>
        <p>Consultant Cybersécurité · 6 ans d'expérience · <span className="score-badge sb-high" style={{ verticalAlign: 'middle' }}>Score 89 %</span></p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head"><h3>Cartographie des compétences</h3><span className="sub">déduite du CV — confiance indiquée</span></div>
        <div className="card-pad">
          <div className="radar-wrap">
            <svg viewBox="0 0 300 300" width="100%">
              <polygon points="150,40 245,95 245,205 150,260 55,205 55,95" fill="none" stroke="#E4E8EC" strokeWidth={1} />
              <polygon points="150,95 198,123 198,177 150,205 102,177 102,123" fill="none" stroke="#EEF1F4" strokeWidth={1} />
              <g stroke="#EEF1F4" strokeWidth={1}>
                <line x1="150" y1="150" x2="150" y2="40" /><line x1="150" y1="150" x2="245" y2="95" /><line x1="150" y1="150" x2="245" y2="205" /><line x1="150" y1="150" x2="150" y2="260" /><line x1="150" y1="150" x2="55" y2="205" /><line x1="150" y1="150" x2="55" y2="95" />
              </g>
              <polygon points="150,51 226,106 221,191 150,244 93,183 83,112" fill="rgba(14,165,165,.16)" stroke="#0A7C7C" strokeWidth={2} />
              <g fill="#0A7C7C"><circle cx="150" cy="51" r="3" /><circle cx="226" cy="106" r="3" /><circle cx="221" cy="191" r="3" /><circle cx="150" cy="244" r="3" /><circle cx="93" cy="183" r="3" /><circle cx="83" cy="112" r="3" /></g>
              <text className="axis-lab" x="150" y="30" textAnchor="middle">Sécurité offensive</text>
              <text className="axis-lab" x="252" y="92" textAnchor="start">Défense / SOC</text>
              <text className="axis-lab" x="252" y="212" textAnchor="start">Réseau</text>
              <text className="axis-lab" x="150" y="278" textAnchor="middle">Conformité ISO</text>
              <text className="axis-lab" x="48" y="212" textAnchor="end">Cloud</text>
              <text className="axis-lab" x="48" y="92" textAnchor="end">Communication</text>
            </svg>
            <div>
              <div className="section-t" style={{ marginTop: 0 }}>Soft skills — indices repérés dans le parcours</div>
              {SOFT.map(([lab, w, tag]) => (
                <div key={lab} className="soft-row">
                  <span className="sr-lab">{lab}</span>
                  <div className="track"><div className="tf" style={{ width: `${w}%` }} /></div>
                  <span className="sr-tag">{tag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Hypothèses comportementales à explorer en entretien</h3></div>
        <div className="card-pad">
          <div className="note" style={{ marginBottom: 16 }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>Ce ne sont pas des verdicts psychologiques. L'IA signale des <b>zones à confirmer</b>, converties en questions d'entretien.</div>
          <div className="hyp"><div className="h-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2v20M2 12h20" /></svg></div><div><b>Parcours très autonome</b><p>Missions récentes en solo. Capacité à opérer dans une équipe cadrée à vérifier.</p><span className="to-check">→ Guide Manager (Q3)</span></div></div>
          <div className="hyp"><div className="h-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="m22 2-7 20-4-9-9-4z" /></svg></div><div><b>Trajectoire ascendante rapide</b><p>3 postes en 6 ans. À croiser avec attentes d'évolution et de rémunération.</p><span className="to-check">→ Guide RH (Q4)</span></div></div>
        </div>
      </div>
    </>
  );
}
