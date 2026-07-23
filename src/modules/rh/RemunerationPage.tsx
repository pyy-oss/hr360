import { Mini, TL } from '@/components/mq';

export function RemunerationPage() {
  return (
    <>
      <div className="page-head">
        <h1>Rémunération</h1>
        <p>Grille par palier, revue de rémunération et suivi de l'équité salariale — la politique de rémunération pilotée avec cohérence.</p>
        <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>Module #32</span>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head"><h3>Bandes salariales par palier</h3><span className="sub">index relatif · base 100 = palier 1</span></div>
        <div className="card-pad">
          <Mini lab="Palier 1 — Junior" w={35} bg="#7C8DA0" val="100" />
          <Mini lab="Palier 2 — Confirmé" w={50} bg="#2C5468" val="135" />
          <Mini lab="Palier 3 — Senior" w={68} bg="var(--signal)" val="175" />
          <Mini lab="Palier 4 — Lead / Manager" w={88} bg="var(--signal-deep)" val="225" />
          <div className="note" style={{ marginTop: 14 }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>Index illustratifs, sans montants réels. La grille et la politique de rémunération sont définies et validées par la DRH.</div>
        </div>
      </div>
      <div className="grid g2">
        <div className="card">
          <div className="card-head"><h3>Revue de rémunération</h3></div>
          <div className="card-pad">
            <TL items={[
              { dot: 'done', title: 'Enveloppe budgétaire cadrée', sub: '' },
              { dot: '', title: 'Propositions managers', sub: 'liées aux entretiens de performance' },
              { dot: 'wait', title: 'Arbitrage & communication', sub: '' },
            ]} />
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Équité salariale suivie</h3></div>
          <div className="card-pad">
            <div className="alert alert-ok" style={{ marginBottom: 14, fontSize: 12 }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20 6 9 17l-5-5" /></svg><div>Écart salarial à poste et palier équivalents sous le seuil de vigilance.</div></div>
            <Mini lab="Écart moyen ajusté" w={12} bg="var(--high)" val="1,8 %" />
            <Mini lab="Dispersion intra-palier" w={30} bg="var(--signal)" val="Maîtrisée" />
          </div>
        </div>
      </div>
    </>
  );
}
