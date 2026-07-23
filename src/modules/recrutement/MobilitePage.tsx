const MATCHS = [
  { av: 'SK', name: 'S. K. — Analyste SOC', meta: 'Équipe Infra · 3 ans chez Neurones', match: 'Match 81 %', gap: 'gap : certification pentest', badge: 'Prêt +', tone: 'sb-high' },
  { av: 'AT', name: 'A. T. — Consultant Réseau', meta: 'Équipe Infra · 5 ans chez Neurones', match: 'Match 74 %', gap: 'gap : conformité ISO 27001', badge: '6 mois', tone: 'sb-mid' },
  { av: 'HB', name: "H. B. — Chargé d'audit", meta: 'Équipe Conseil · 2 ans chez Neurones', match: 'Match 69 %', gap: 'gap : sécurité offensive', badge: '9 mois', tone: 'sb-mid' },
];

export function MobilitePage() {
  return (
    <>
      <div className="page-head">
        <h1>Mobilité interne</h1>
        <p>Avant de recruter à l'externe, l'outil propose les collaborateurs Neurones dont le profil correspond — moins cher, plus rapide, plus fidélisant.</p>
      </div>

      <div className="alert alert-ok" style={{ marginBottom: 16 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20 6 9 17l-5-5" /></svg>
        <div><b>Priorité interne <span className="feat">#2</span></b> — 3 collaborateurs correspondent au poste « Consultant Cybersécurité ». Adossé à l'initiative de développement des talents.</div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Collaborateurs correspondants</h3><span className="sub">match interne · gap de compétences</span></div>
        {MATCHS.map((m) => (
          <div key={m.av} className="cand">
            <div className="c-av" style={{ background: 'var(--signal-soft)', color: 'var(--signal-deep)' }}>{m.av}</div>
            <div style={{ width: 200 }}>
              <div className="c-name">{m.name}</div>
              <div className="c-meta">{m.meta}</div>
            </div>
            <div className="c-mid">
              <span className="chip on">{m.match}</span>{' '}
              <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>{m.gap}</span>
            </div>
            <span className={`score-badge ${m.tone}`}>{m.badge}</span>
          </div>
        ))}
      </div>

      <div className="note" style={{ marginTop: 16 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
        Chaque gap est relié à un parcours de montée en compétences de l'Académie / du plan de développement — le recrutement interne devient un plan de formation ciblé.
      </div>
    </>
  );
}
