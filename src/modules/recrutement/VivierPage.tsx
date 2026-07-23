const REQUAL = [
  { av: 'SG', name: 'Salif Guéï', meta: 'candidature de mars · 5 ans', match: 'Nouveau match 84 %', from: 'provenance : poste SOC 2025', delta: '+29 pts' },
  { av: 'NB', name: 'Nadège Brou', meta: 'candidature de janvier · 4 ans', match: 'Nouveau match 79 %', from: 'provenance : cand. spontanée', delta: '+22 pts' },
  { av: 'OD', name: 'Omar Doumbia', meta: 'candidature de mai · 6 ans', match: 'Nouveau match 76 %', from: 'provenance : poste audit', delta: '+18 pts' },
];

export function VivierPage() {
  return (
    <>
      <div className="page-head">
        <h1>Vivier de talents</h1>
        <p>La base de tous les CV déjà reçus. À chaque nouveau poste, les profils sont re-scorés automatiquement — on ne repart jamais de zéro.</p>
      </div>

      <div className="alert alert-info" style={{ marginBottom: 16 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15" /></svg>
        <div><b>Re-scoring rétroactif <span className="feat">#1</span></b> — 23 profils du vivier viennent d'être re-scorés sur le poste « Consultant Cybersécurité ». 4 anciens candidats repassent au-dessus de 75 %.</div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head"><h3>Profils re-qualifiés</h3><span className="sub">triés par nouveau score</span></div>
        {REQUAL.map((c) => (
          <div key={c.av} className="cand">
            <div className="c-av">{c.av}</div>
            <div style={{ width: 180 }}>
              <div className="c-name">{c.name}</div>
              <div className="c-meta">{c.meta}</div>
            </div>
            <div className="c-mid">
              <span className="chip on">{c.match}</span>{' '}
              <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>{c.from}</span>
            </div>
            <span className="score-badge sb-high">{c.delta}</span>
          </div>
        ))}
      </div>

      <div className="grid g2">
        <div className="card">
          <div className="card-head"><h3>Enrichissement par preuves publiques</h3><span className="feat">#3</span></div>
          <div className="card-pad">
            <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: 12 }}>Avec consentement, le CV est croisé avec les traces publiques du candidat — le CV dit, le dépôt prouve.</div>
            <div className="ref-row"><svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="var(--muted)" strokeWidth={1.8}><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.9a3.4 3.4 0 0 0-.9-2.6c3-.3 6.2-1.5 6.2-6.7A5.2 5.2 0 0 0 20 4.8 4.8 4.8 0 0 0 19.9 1S18.7.6 16 2.5a13.4 13.4 0 0 0-7 0C6.3.6 5.1 1 5.1 1A4.8 4.8 0 0 0 5 4.8a5.2 5.2 0 0 0-1.4 3.6c0 5.2 3.2 6.4 6.2 6.7a3.4 3.4 0 0 0-.9 2.6V22" /></svg><span>GitHub · 47 dépôts, dont 3 outils de sécurité</span><span className="chip on ref-w" style={{ marginLeft: 'auto' }}>Vérifié</span></div>
            <div className="ref-row"><svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="var(--muted)" strokeWidth={1.8}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /></svg><span>Article technique sur EBIOS RM (2024)</span><span className="chip ref-w" style={{ marginLeft: 'auto' }}>Cohérent</span></div>
            <div className="ref-row" style={{ border: 'none' }}><svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="var(--muted)" strokeWidth={1.8}><path d="M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" /></svg><span>Certification OSCP validée en ligne</span><span className="chip on ref-w" style={{ marginLeft: 'auto' }}>Vérifié</span></div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Détection d'incohérences</h3><span className="feat">#4</span></div>
          <div className="card-pad">
            <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: 12 }}>Signalé au recruteur pour vérification — jamais un motif de rejet automatique.</div>
            <div className="hyp"><div className="h-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg></div><div><b>Trou chronologique de 14 mois</b><p>Entre le poste de 2022 et celui de 2023 — à clarifier en entretien.</p></div></div>
            <div className="hyp"><div className="h-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg></div><div><b>Dates qui se chevauchent</b><p>Deux emplois déclarés en parallèle sur 2021 — vérifier s'il s'agissait de missions cumulées.</p></div></div>
            <div className="hyp" style={{ border: 'none' }}><div className="h-ic" style={{ background: 'var(--high-soft)', color: 'var(--high)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20 6 9 17l-5-5" /></svg></div><div><b>Diplôme vérifiable</b><p>Établissement et intitulé reconnus dans le référentiel des équivalences.</p></div></div>
          </div>
        </div>
      </div>
    </>
  );
}
