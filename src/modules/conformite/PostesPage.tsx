const TECH: [string, string, string][] = [
  ['MUST', "Tests d'intrusion & audit", '×3'],
  ['MUST', 'Normes ISO 27001 / EBIOS RM', '×3'],
  ['MUST', 'Sécurité réseau & pare-feu', '×2'],
  ['NICE', 'Supervision SIEM', '×2'],
  ['NICE', 'Certif. OSCP / CEH / CISSP', '×2'],
];

export function PostesPage() {
  return (
    <>
      <div className="page-head">
        <h1>Postes &amp; référentiel</h1>
        <p>Le référentiel définit « en amont » ce que l'on cherche : compétences éliminatoires, pondérations, et critères explicitement exclus.</p>
      </div>
      <div className="card">
        <div className="card-head"><h3>Consultant Cybersécurité — Confirmé</h3><span className="sub">4–6 ans · Bac+5 · FR / EN</span></div>
        <div className="card-pad">
          <div className="section-t" style={{ marginTop: 0 }}>Pondérations globales du score</div>
          <div className="weights">
            <div style={{ flex: 50, background: 'var(--signal-deep)' }}>Technique 50 %</div>
            <div style={{ flex: 25, background: '#2C5468' }}>Expérience 25 %</div>
            <div style={{ flex: 15, background: 'var(--gold)' }}>Soft 15 %</div>
            <div style={{ flex: 10, background: '#7C8DA0' }}>Form. 10 %</div>
          </div>
          <div className="grid g2" style={{ marginTop: 22, gap: 28 }}>
            <div>
              <div className="section-t" style={{ marginTop: 0 }}>Compétences techniques</div>
              {TECH.map(([tag, label, w], i) => (
                <div key={label} className="ref-row" style={i === TECH.length - 1 ? { border: 'none' } : undefined}>
                  <span className={tag === 'MUST' ? 'tag-must' : 'tag-nice'}>{tag}</span><span>{label}</span><span className="ref-w">{w}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="section-t" style={{ marginTop: 0 }}>Soft skills observables</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {['Vulgariser un risque à un COMEX', 'Rigueur documentaire', 'Gestion du stress en incident', 'Posture conseil'].map((s) => (
                  <span key={s} className="chip must">{s}</span>
                ))}
              </div>
              <div className="section-t">Critères exclus du scoring</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['ÂGE', 'GENRE', 'ORIGINE', 'PHOTO'].map((t) => <span key={t} className="tag-excl">{t}</span>)}
              </div>
              <div className="note" style={{ marginTop: 14 }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>Jamais lus par le moteur. Journalisé pour l'audit ARTCI.</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
