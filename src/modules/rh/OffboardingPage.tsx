import { TL } from '@/components/mq';

const RESTIT = ['Comptes & accès IT désactivés', 'Matériel restitué', "Badge d'accès rendu", 'Documents de fin de contrat remis'];

export function OffboardingPage() {
  return (
    <>
      <div className="page-head">
        <h1>Offboarding</h1>
        <p>Un départ bien géré protège l'entreprise et sa réputation — transfert de connaissances, restitution et enseignements tirés.</p>
        <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>Module #34</span>
      </div>
      <div className="grid g2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-head"><h3>Process de départ</h3></div>
          <div className="card-pad">
            <TL items={[
              { dot: 'done', title: 'Notification & préavis', sub: 'calcul automatique des dates' },
              { dot: '', title: 'Transfert de connaissances', sub: 'passation missions & clients' },
              { dot: 'wait', title: 'Restitution & clôture des accès', sub: 'matériel, badges, comptes IT' },
              { dot: 'wait', title: 'Solde de tout compte & documents', sub: 'attestations générées' },
            ]} />
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Checklist de restitution</h3></div>
          <div className="card-pad">
            {RESTIT.map((r) => (
              <div key={r} className="setting"><div className="st-txt"><b>{r}</b></div><div className="tog" /></div>
            ))}
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-head"><h3>Entretien de départ — enseignements</h3></div>
        <div className="card-pad">
          <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: 12 }}>Synthèse anonymisée et agrégée, pour améliorer la rétention — jamais nominative.</div>
          <div className="hyp"><div className="h-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg></div><div><b>Motif principal (12 mois)</b><p style={{ fontSize: '12.5px', color: 'var(--muted)' }}>Perspectives d'évolution — 1er facteur cité, cohérent avec l'enquête climat.</p></div></div>
          <div className="hyp" style={{ border: 'none' }}><div className="h-ic" style={{ background: 'var(--high-soft)', color: 'var(--high)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20 6 9 17l-5-5" /></svg></div><div><b>Points forts reconnus</b><p style={{ fontSize: '12.5px', color: 'var(--muted)' }}>Qualité technique des missions et ambiance d'équipe.</p></div></div>
        </div>
      </div>
    </>
  );
}
