import { Mini } from '@/components/mq';

const PENDING = [
  { title: 'Congés payés — 5 jours', sub: 'Consultant Réseau · août' },
  { title: 'Récupération — 1 jour', sub: 'Analyste SOC · juillet' },
  { title: 'Congé sans solde — 3 jours', sub: "Chargé d'audit · septembre" },
];

export function AbsencesPage() {
  return (
    <>
      <div className="page-head">
        <h1>Absences &amp; congés</h1>
        <p>Demandes, validations et soldes en un seul flux — avec une vue de disponibilité pour ne jamais staffer un absent.</p>
        <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>Module #31</span>
      </div>
      <div className="grid g2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-head"><h3>Demandes en attente</h3><span className="sub">à valider</span></div>
          <div className="card-pad">
            {PENDING.map((p) => (
              <div key={p.title} className="setting">
                <div className="st-txt"><b>{p.title}</b><p>{p.sub}</p></div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-primary" style={{ padding: '6px 10px' }}>Valider</button>
                  <button className="btn btn-ghost" style={{ padding: '6px 10px' }}>Refuser</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Soldes de congés</h3></div>
          <div className="card-pad">
            <Mini lab="S. K." w={60} bg="var(--signal)" val="12 j" />
            <Mini lab="A. T." w={40} bg="var(--signal)" val="8 j" />
            <Mini lab="H. B." w={85} bg="var(--mid)" val="18 j" />
            <div className="alert alert-warn" style={{ marginTop: 12, fontSize: 12 }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg><div>Solde élevé chez H. B. : planifier une prise avant fin d'exercice.</div></div>
          </div>
        </div>
      </div>
    </>
  );
}
