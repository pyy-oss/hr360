const FILE_IC = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /></svg>
);
const WARN_IC = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
);

type ScanCard = { icon: JSX.Element; title: string; sub: string; status: JSX.Element; processing?: boolean };
const CARDS: ScanCard[] = [
  { icon: FILE_IC, processing: true, title: 'Candidature — Consultant Cybersécurité', sub: 'CV_A.Kone.pdf · reçu il y a 6 min · OCR + extraction en cours', status: <span className="status st-proc"><span className="pdot" /> Analyse</span> },
  { icon: FILE_IC, title: 'Candidature — Consultant Cybersécurité', sub: 'CV-Diallo-2026.pdf · scoré à 82 % · rattaché automatiquement', status: <span className="status st-done"><span className="pdot" /> Scoré</span> },
  { icon: FILE_IC, title: 'Candidature spontanée — sans poste précisé', sub: 'cv_ibrahima_dev.docx · rattachée à « Développeur Full-Stack » (suggestion IA)', status: <span className="status st-done"><span className="pdot" /> Rattachée</span> },
  { icon: WARN_IC, title: 'Doublon détecté', sub: 'M. Diallo a déjà postulé le 12/06 — candidatures fusionnées', status: <span className="status st-wait"><span className="pdot" /> Fusionné</span> },
];

export function BoiteRhPage() {
  return (
    <>
      <div className="page-head">
        <h1>Boîte RH</h1>
        <p>Connexion à <b>recrutement@neuronestech.com</b> via Microsoft 365. Chaque email est scanné, ses pièces jointes extraites (OCR inclus) et rattachées automatiquement à un poste.</p>
      </div>
      <div className="card">
        <div className="card-head">
          <h3>File de traitement</h3>
          <span className="status st-proc" style={{ marginLeft: 'auto' }}><span className="pdot" /> Scan actif · synchro il y a 6 min</span>
        </div>
        <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {CARDS.map((c, i) => (
            <div key={i} className={`scan-card${c.processing ? ' processing' : ''}`}>
              {c.processing && <div className="scan-line" />}
              <div className="s-ic">{c.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <b style={{ fontSize: '13.5px' }}>{c.title}</b>
                <div style={{ fontSize: 12, color: 'var(--muted-2)' }}>{c.sub}</div>
              </div>
              {c.status}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
