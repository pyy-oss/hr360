type TL = { dot: '' | 'done' | 'wait'; title: string; sub: string };

const WORKFLOWS: TL[] = [
  { dot: 'done', title: 'Accusé de réception envoyé', sub: 'automatique à chaque candidature' },
  { dot: 'done', title: 'Convocation entretien', sub: 'créneau proposé via Outlook · confirmé' },
  { dot: '', title: 'Relance jury J-1', sub: 'rappel grille + guide aux 3 membres' },
  { dot: 'wait', title: 'Réponse aux candidats non retenus', sub: 'en attente de validation RH' },
];
const ONBOARD: TL[] = [
  { dot: 'done', title: 'Dossier candidat transféré', sub: 'vers le module RH / intégration' },
  { dot: '', title: 'Création des accès IT', sub: 'comptes, matériel, badges' },
  { dot: 'wait', title: "Parcours d'accueil", sub: 'planning J1 + rattachement équipe' },
];

function Timeline({ items }: { items: TL[] }) {
  return (
    <div className="tl">
      {items.map((it) => (
        <div key={it.title} className="tl-item">
          <div className={`tl-dot${it.dot ? ' ' + it.dot : ''}`} />
          <b style={{ fontSize: 13 }}>{it.title}</b>
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>{it.sub}</p>
        </div>
      ))}
    </div>
  );
}

export function PilotagePage() {
  return (
    <>
      <div className="page-head">
        <h1>Pilotage prédictif</h1>
        <p>Anticiper les besoins, automatiser les tâches sans valeur ajoutée, et passer le relais à l'onboarding sans ressaisie.</p>
      </div>

      <div className="alert alert-warn" style={{ marginBottom: 16 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
        <div><b>Recrutement prédictif <span className="feat">#17</span></b> — un appel d'offres secteur bancaire est en phase finale (probabilité de gain élevée). Anticipez le staffing de 8 profils cyber pour tenir le délai de démarrage. Recruter avant d'avoir le couteau sous la gorge.</div>
      </div>

      <div className="grid g2">
        <div className="card">
          <div className="card-head"><h3>Workflows automatisés</h3><span className="feat">#18</span></div>
          <div className="card-pad">
            <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: 16 }}>Relances, convocations et mises à jour de statut orchestrées via Microsoft 365. Le recruteur pilote, l'outil exécute.</div>
            <Timeline items={WORKFLOWS} />
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Passerelle onboarding</h3><span className="feat">#19</span></div>
          <div className="card-pad">
            <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: 16 }}>Une fois recruté, transmission automatique vers l'intégration — sans ressaisie.</div>
            <Timeline items={ONBOARD} />
          </div>
        </div>
      </div>
    </>
  );
}
