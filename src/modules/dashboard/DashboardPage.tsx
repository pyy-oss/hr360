import { Link } from 'react-router-dom';

const KPIS = [
  {
    val: '148', lab: 'Candidatures reçues (30 j)', delta: '▲ 22 %', tone: 'up',
    icon: (<><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 6 10-6" /></>),
  },
  {
    val: '61', lab: 'CV scorés', delta: '100 % automatisé', tone: 'up',
    icon: (<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></>),
  },
  {
    val: '214', lab: 'Profils au vivier', delta: 're-scorés en continu', tone: 'up',
    icon: (<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></>),
  },
  {
    val: '4,2 j', lab: 'Délai moyen de tri', delta: '▼ 68 %', tone: 'up',
    icon: (<path d="M5 3v4M3 5h4M6 17v4M4 19h4M13 3l2.5 6L22 11l-6.5 2L13 19l-2.5-6L4 11l6.5-2z" />),
  },
];

const FUNNEL = [
  { lab: 'Reçues', w: 100, bg: 'var(--ink-2)', txt: 'Candidatures', n: 61 },
  { lab: 'Parsées', w: 93, bg: '#2C5468', txt: 'CV structurés', n: 57 },
  { lab: 'Requis validés', w: 56, bg: 'var(--signal-deep)', txt: 'Prérequis OK', n: 34 },
  { lab: 'Score ≥ 70 %', w: 31, bg: 'var(--signal)', txt: 'Pré-sélection', n: 19 },
  { lab: 'Shortlist jury', w: 15, bg: 'var(--gold)', txt: 'Recommandés', n: 9 },
];

const POSTES = [
  { title: 'Consultant Cybersécurité', dept: 'Cybersécurité & Audit', n: 61, tone: 'sb-high' },
  { title: 'Ingénieur Infra & Cloud', dept: 'Infra & Réseaux', n: 38, tone: 'sb-mid' },
  { title: 'Développeur Full-Stack', dept: 'Studio Produits', n: 27, tone: 'sb-mid' },
  { title: 'Chef de projet AMOA', dept: 'Conseil', n: 14, tone: 'sb-low' },
];

export function DashboardPage() {
  return (
    <>
      <div className="page-head">
        <h1>Tableau de bord</h1>
        <p>Vue d'ensemble du pipeline piloté par l'IA. Chaque candidature reçue par email est scannée, analysée et rattachée à un poste ouvert.</p>
      </div>

      <Link to="/pilotage" className="alert alert-warn" style={{ marginBottom: 16, textDecoration: 'none' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
        <div><b>Alerte prédictive</b> — un appel d'offres secteur bancaire est en phase finale : anticipez le staffing de 8 profils cyber. <span style={{ textDecoration: 'underline' }}>Voir le pilotage prédictif →</span></div>
      </Link>

      <div className="grid g4" style={{ marginBottom: 16 }}>
        {KPIS.map((k) => (
          <div key={k.lab} className="card kpi">
            <div className="k-top">
              <div className="k-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">{k.icon}</svg></div>
            </div>
            <div className="k-val display">{k.val}</div>
            <div className="k-lab">{k.lab}</div>
            <div className={`k-delta ${k.tone}`}>{k.delta}</div>
          </div>
        ))}
      </div>

      <div className="grid g2">
        <div className="card">
          <div className="card-head"><h3>Entonnoir de recrutement</h3><span className="sub">Consultant Cybersécurité</span></div>
          <div className="card-pad">
            <div className="funnel">
              {FUNNEL.map((f) => (
                <div key={f.lab} className="fn-row">
                  <span className="fn-lab">{f.lab}</span>
                  <div className="fn-bar" style={{ width: `${f.w}%`, background: f.bg }}>{f.txt}</div>
                  <span className="fn-n">{f.n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Postes ouverts</h3></div>
          <div className="card-pad" style={{ paddingTop: 6 }}>
            {POSTES.map((p) => (
              <div key={p.title} className="ref-row">
                <div>
                  <b style={{ fontSize: '13.5px' }}>{p.title}</b>
                  <div style={{ fontSize: 12, color: 'var(--muted-2)' }}>{p.dept}</div>
                </div>
                <span className={`score-badge ${p.tone} mono ref-w`}>{p.n}</span>
              </div>
            ))}
            <Link to="/postes" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}>
              Gérer les référentiels
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
