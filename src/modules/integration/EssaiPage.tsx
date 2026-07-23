import { Mini, TL } from '@/components/mq';

const OBJ: [string, JSX.Element][] = [
  ['Monter en autonomie sur les missions pentest', <span className="chip on ref-w" style={{ marginLeft: 'auto' }}>Atteint</span>],
  ["Livrer un rapport d'audit conforme", <span className="chip on ref-w" style={{ marginLeft: 'auto' }}>Atteint</span>],
  ["S'intégrer dans une équipe cadrée", <span className="chip ref-w" style={{ marginLeft: 'auto', background: 'var(--mid-soft)', color: 'var(--mid)', border: 'none' }}>En progrès</span>],
  ['Maîtriser le contexte réglementaire local', <span className="chip ref-w" style={{ marginLeft: 'auto', background: 'var(--mid-soft)', color: 'var(--mid)', border: 'none' }}>En progrès</span>],
];

export function EssaiPage() {
  return (
    <>
      <div className="page-head">
        <h1>Période d'essai</h1>
        <p>Objectifs cadrés dès le départ, points d'étape suivis, et une décision documentée à l'échéance — confirmation, prolongation ou fin.</p>
        <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>Fonctionnalité #24</span>
      </div>
      <div className="alert alert-warn" style={{ marginBottom: 16 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
        <div><b>Échéance à J90 dans 12 jours</b> — un point de décision est requis. La grille d'évaluation d'essai est pré-remplie à partir des points d'étape.</div>
      </div>
      <div className="grid g2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-head"><h3>Objectifs de la période d'essai</h3></div>
          <div className="card-pad">
            {OBJ.map(([label, chip], i) => (
              <div key={label} className="ref-row" style={i === OBJ.length - 1 ? { border: 'none' } : undefined}><span>{label}</span>{chip}</div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Points d'étape</h3></div>
          <div className="card-pad">
            <TL items={[
              { dot: 'done', title: 'J30 — premier bilan', sub: 'intégration positive, technique confirmée' },
              { dot: 'done', title: 'J60 — bilan intermédiaire', sub: 'autonomie en hausse, travail en équipe à consolider' },
              { dot: '', title: 'J90 — décision de fin d\'essai', sub: 'à statuer' },
            ]} />
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-head"><h3>Évaluation &amp; décision de fin d'essai</h3></div>
        <div className="card-pad">
          <Mini lab="Compétences techniques" w={90} bg="var(--signal-deep)" val="Fort" />
          <Mini lab="Autonomie" w={78} bg="var(--signal)" val="Bon" />
          <Mini lab="Intégration équipe" w={66} bg="var(--gold)" val="En progrès" />
          <Mini lab="Adéquation globale" w={84} bg="var(--high)" val="84 %" />
          <div className="note" style={{ marginTop: 14 }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>Recommandation IA : <b>confirmation</b>, avec un objectif de consolidation du travail en équipe. La durée et les règles de la période d'essai suivent la convention collective applicable, validées par la DRH.</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <button className="btn btn-primary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20 6 9 17l-5-5" /></svg>Confirmer l'embauche</button>
            <button className="btn btn-ghost">Prolonger l'essai</button>
            <button className="btn btn-ghost">Mettre fin à l'essai</button>
          </div>
        </div>
      </div>
    </>
  );
}
