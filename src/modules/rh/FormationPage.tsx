import { Mini } from '@/components/mq';

const CATALOG: [string, string][] = [
  ['Parcours cybersécurité offensive', '6 modules'],
  ['Conformité & normes ISO', '4 modules'],
  ['Posture conseil & relation client', '3 modules'],
  ['Leadership de mission', 'Nouveau'],
];

export function FormationPage() {
  return (
    <>
      <div className="page-head">
        <h1>Formation</h1>
        <p>Le catalogue, les plans de montée en compétences et le suivi des certifications — reliés à la matrice de compétences et aux besoins de recrutement.</p>
        <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>Module #29</span>
      </div>
      <div className="grid g2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-head"><h3>Plans en cours</h3></div>
          <div className="card-pad">
            <Mini lab="Certification OSCP (2 pers.)" w={60} bg="var(--signal)" val="60 %" />
            <Mini lab="ISO 27001 Lead Auditor" w={45} bg="var(--signal)" val="45 %" />
            <Mini lab="Sécurité cloud Azure" w={80} bg="var(--high)" val="80 %" />
            <Mini lab="Posture conseil (soft skills)" w={30} bg="var(--gold)" val="30 %" />
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Catalogue interne</h3><span className="sub">Académie Neurones</span></div>
          <div className="card-pad">
            {CATALOG.map(([label, tag], i) => (
              <div key={label} className="ref-row" style={i === CATALOG.length - 1 ? { border: 'none' } : undefined}><span>{label}</span><span className="chip ref-w" style={{ marginLeft: 'auto' }}>{tag}</span></div>
            ))}
          </div>
        </div>
      </div>
      <div className="note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2 2 7l10 5 10-5-10-5Z" /></svg>Chaque case faible de la matrice de compétences propose automatiquement un module du catalogue — la formation devient pilotée par les besoins réels.</div>
    </>
  );
}
