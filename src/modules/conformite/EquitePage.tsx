import { Mini } from '@/components/mq';

const CHECK = <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="var(--high)" strokeWidth={2}><path d="M20 6 9 17l-5-5" /></svg>;
const SETTINGS: { title: string; feat?: string; sub: string; on: boolean }[] = [
  { title: 'Phase 1 à l\'aveugle', feat: '#16', sub: 'Anonymise nom, photo, âge et genre pour le premier tri du jury.', on: true },
  { title: 'Pseudonymisation avant scoring', sub: 'Le moteur note des compétences, jamais une identité.', on: true },
  { title: 'Purge automatique', feat: '#15', sub: 'Suppression des CV après la durée légale de conservation.', on: true },
  { title: 'Portail candidat', sub: 'Accès et suppression de ses données par le candidat lui-même.', on: false },
];
const DOSSIER = [
  'Score décomposé (4 axes) & contribution par compétence',
  'Extraits de CV justifiant chaque niveau',
  'Versions du référentiel et du modèle utilisés',
  'Horodatage & journal des décisions',
];

export function EquitePage() {
  return (
    <>
      <div className="page-head">
        <h1>Équité &amp; audit</h1>
        <p>La couche qui protège Neurones : surveillance des biais en continu, dossiers d'explicabilité et conformité ARTCI.</p>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head"><h3>Tableau d'équité en continu</h3><span className="feat">#13</span></div>
        <div className="card-pad">
          <div className="alert alert-ok" style={{ marginBottom: 16 }}>{CHECK}<div>Aucune corrélation significative détectée entre les scores et un attribut protégé sur les 30 derniers jours.</div></div>
          <Mini lab="Corrélation score / genre" w={8} bg="var(--high)" val="0,04" />
          <Mini lab="Corrélation score / âge" w={11} bg="var(--high)" val="0,06" />
          <Mini lab="Corrélation score / origine" w={6} bg="var(--high)" val="0,03" />
          <div style={{ fontSize: '11.5px', color: 'var(--muted-2)', marginTop: 8 }}>Seuil d'alerte : 0,20. Au-delà, le référentiel ou l'extraction sont révisés.</div>
        </div>
      </div>
      <div className="grid g2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-head"><h3>Réglages de conformité</h3></div>
          <div className="card-pad">
            {SETTINGS.map((s) => (
              <div key={s.title} className="setting">
                <div className="st-txt"><b>{s.title} {s.feat && <span className="feat">{s.feat}</span>}</b><p>{s.sub}</p></div>
                <div className={`tog${s.on ? ' on' : ''}`} />
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Dossier de décision exportable</h3><span className="feat">#14</span></div>
          <div className="card-pad">
            <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: 14 }}>Pour chaque candidat, un dossier d'explicabilité complet — prêt pour l'ARTCI ou un contentieux.</div>
            {DOSSIER.map((d, i) => (
              <div key={d} className="ref-row" style={i === DOSSIER.length - 1 ? { border: 'none' } : undefined}>{CHECK}<span>{d}</span></div>
            ))}
            <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 15V3M7 10l5 5 5-5M5 21h14" /></svg>Exporter le dossier</button>
          </div>
        </div>
      </div>
    </>
  );
}
