import { StateChip, TL } from '@/components/mq';

type Cell = [number, string];
const MATRIX: { name: string; cells: Cell[] }[] = [
  { name: 'Aïcha K.', cells: [[4, 'sb-high'], [4, 'sb-high'], [2, 'sb-mid'], [2, 'sb-mid']] },
  { name: 'S. K.', cells: [[2, 'sb-mid'], [3, 'sb-mid'], [4, 'sb-high'], [3, 'sb-mid']] },
  { name: 'H. B.', cells: [[1, 'sb-low'], [4, 'sb-high'], [2, 'sb-mid'], [1, 'sb-low']] },
];
const COLS = ['Pentest', 'ISO / EBIOS', 'SIEM', 'Cloud sec.'];

export function CompetencesPage() {
  return (
    <>
      <div className="page-head">
        <h1>Compétences &amp; carrières</h1>
        <p>La cartographie vivante des compétences de l'entreprise, les plans de carrière et la préparation de la relève sur les postes clés.</p>
        <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>Module #28</span>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head"><h3>Matrice de compétences — pôle Cyber</h3><span className="sub">niveau 1 à 4</span></div>
        <div className="card-pad" style={{ overflowX: 'auto' }}>
          <table className="grille-table">
            <thead><tr><th>Collaborateur</th>{COLS.map((c) => <th key={c} style={{ textAlign: 'center' }}>{c}</th>)}</tr></thead>
            <tbody>
              {MATRIX.map((r) => (
                <tr key={r.name}>
                  <td><b>{r.name}</b></td>
                  {r.cells.map(([v, tone], i) => (
                    <td key={i} style={{ textAlign: 'center' }}><span className={`score-badge ${tone}`} style={{ padding: '2px 7px' }}>{v}</span></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: 12, color: 'var(--muted-2)', marginTop: 10 }}>Les cases faibles alimentent directement les plans de formation et les besoins de recrutement.</div>
        </div>
      </div>
      <div className="grid g2">
        <div className="card">
          <div className="card-head"><h3>Plan de carrière type</h3></div>
          <div className="card-pad">
            <TL items={[
              { dot: 'done', title: 'Consultant confirmé', sub: 'niveau actuel' },
              { dot: '', title: 'Consultant senior', sub: 'gap : leadership de mission' },
              { dot: 'wait', title: 'Manager Cyber', sub: 'horizon 3-4 ans' },
            ]} />
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Plan de succession — postes clés</h3></div>
          <div className="card-pad">
            <div className="ref-row"><span>Manager Cyber &amp; Audit</span><StateChip tone="ok">2 successeurs identifiés</StateChip></div>
            <div className="ref-row"><span>Lead Infrastructure</span><StateChip tone="mid">1 en préparation</StateChip></div>
            <div className="ref-row" style={{ border: 'none' }}><span>Directeur technique</span><StateChip tone="low">Risque : à couvrir</StateChip></div>
          </div>
        </div>
      </div>
    </>
  );
}
