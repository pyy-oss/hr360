import { Mini, Kpi } from '@/components/mq';

const DEPTS: [string, number, string, string][] = [
  ['Cybersécurité & Audit', 82, 'var(--signal-deep)', '38'],
  ['Infrastructure & Réseaux', 70, 'var(--signal)', '32'],
  ['Studio Produits', 52, '#2C5468', '24'],
  ['Conseil / AMOA', 40, 'var(--gold)', '18'],
  ['Support & fonctions', 34, '#7C8DA0', '16'],
];
const TURN: [string, number, string, string][] = [
  ['T1', 30, 'var(--signal)', '2,1 %'],
  ['T2', 38, 'var(--signal)', '2,6 %'],
  ['T3', 26, 'var(--signal)', '1,8 %'],
  ['T4 (projeté)', 40, 'var(--muted-2)', '2,7 %'],
];

export function AnalyticsPage() {
  return (
    <>
      <div className="page-head">
        <h1>Analytics RH</h1>
        <p>La vue d'ensemble des effectifs et de leur dynamique — pour piloter la masse de talents comme un actif stratégique.</p>
        <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>Module #25</span>
      </div>
      <div className="grid g4" style={{ marginBottom: 16 }}>
        <Kpi val="128" lab="Effectif total" delta="▲ 11 postes (12 mois)" icon={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></>} />
        <Kpi val="9,2 %" lab="Turnover annuel" delta="▼ sous la moyenne secteur" icon={<><path d="M16 3h5v5M4 20 21 3" /></>} />
        <Kpi val="3,4 ans" lab="Ancienneté moyenne" icon={<><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>} />
        <Kpi val="4" lab="Postes ouverts" icon={<path d="M20 7h-3V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />} />
      </div>
      <div className="grid g2">
        <div className="card">
          <div className="card-head"><h3>Répartition par département</h3></div>
          <div className="card-pad">{DEPTS.map((d) => <Mini key={d[0]} lab={d[0]} w={d[1]} bg={d[2]} val={d[3]} />)}</div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Turnover par trimestre</h3></div>
          <div className="card-pad">
            {TURN.map((d) => <Mini key={d[0]} lab={d[0]} w={d[1]} bg={d[2]} val={d[3]} />)}
            <div className="alert alert-ok" style={{ marginTop: 14, fontSize: 12 }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20 6 9 17l-5-5" /></svg><div>Aucun département en zone de risque de fuite des talents.</div></div>
          </div>
        </div>
      </div>
    </>
  );
}
