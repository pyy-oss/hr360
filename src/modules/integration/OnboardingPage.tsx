import { TL } from '@/components/mq';

const CHECKLIST: { title: string; sub: string; status: JSX.Element }[] = [
  { title: 'Comptes & accès IT', sub: 'Messagerie, VPN, outils cyber.', status: <span className="status st-done"><span className="pdot" /> Fait</span> },
  { title: 'Matériel & badge', sub: "Poste de travail, badge d'accès.", status: <span className="status st-done"><span className="pdot" /> Fait</span> },
  { title: 'Rattachement équipe & manager', sub: "Manager Cyber désigné, parrain d'intégration.", status: <span className="status st-proc"><span className="pdot" /> En cours</span> },
  { title: 'Plan de formation initial', sub: "Parcours relié à l'Académie / au développement des talents.", status: <span className="status st-wait"><span className="pdot" /> Planifié</span> },
];

export function OnboardingPage() {
  return (
    <>
      <div className="page-head">
        <h1>Onboarding</h1>
        <p>Dès la signature, un parcours d'accueil structuré se déclenche — sans ressaisie depuis le dossier de recrutement.</p>
        <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>Fonctionnalité #23</span>
      </div>
      <div className="grid g2">
        <div className="card">
          <div className="card-head"><h3>Parcours d'accueil</h3><span className="sub">Aïcha Koné · démarrage confirmé</span></div>
          <div className="card-pad">
            <TL items={[
              { dot: 'done', title: 'Pré-boarding (J-7)', sub: 'mot de bienvenue, documents administratifs, préparation du poste' },
              { dot: 'done', title: 'Jour 1', sub: "accueil, remise du matériel, présentation de l'équipe" },
              { dot: '', title: 'Semaine 1', sub: 'immersion outils & process, premières missions cadrées' },
              { dot: 'wait', title: 'Mois 1', sub: "point d'étape manager, cadrage des objectifs d'essai" },
            ]} />
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Checklist d'intégration</h3></div>
          <div className="card-pad">
            {CHECKLIST.map((c) => (
              <div key={c.title} className="setting"><div className="st-txt"><b>{c.title}</b><p>{c.sub}</p></div>{c.status}</div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
