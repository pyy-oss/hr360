export function AssistantPage() {
  return (
    <>
      <div className="page-head">
        <h1>Assistant RH interne</h1>
        <p>Un copilote conversationnel pour les managers et la RH — poser une question en langage naturel plutôt que fouiller les écrans.</p>
        <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>Fonctionnalité #20</span>
      </div>

      <div className="chat">
        <div className="msg u">
          <div className="m-av usr">MG</div>
          <div className="m-body">Montre-moi les 3 meilleurs profils cyber disponibles dans le vivier.</div>
        </div>
        <div className="msg">
          <div className="m-av ai">IA</div>
          <div className="m-body">
            Voici les 3 profils les mieux notés, re-scorés sur le référentiel « Consultant Cybersécurité » :<br />
            • <b>Aïcha Koné</b> — 89 % · disponible<br />
            • <b>Mamadou Diallo</b> — 82 % · disponible<br />
            • <b>Salif Guéï</b> — 84 % (vivier, re-qualifié)<br />
            <span style={{ color: 'var(--muted-2)', fontSize: 12 }}>Souhaitez-vous générer leurs supports d'entretien ?</span>
          </div>
        </div>
        <div className="msg u">
          <div className="m-av usr">MG</div>
          <div className="m-body">Où en est le poste de développeur full-stack ?</div>
        </div>
        <div className="msg">
          <div className="m-av ai">IA</div>
          <div className="m-body">27 candidatures reçues, 19 scorées, 5 en shortlist. Le délai de tri moyen est de 3 jours. Aucun entretien n'est encore planifié — voulez-vous que je propose des créneaux au jury ?</div>
        </div>
        <div className="chat-input">
          <div className="ci">Poser une question à l'assistant RH…</div>
          <button className="btn btn-primary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="m22 2-7 20-4-9-9-4z" /></svg></button>
        </div>
      </div>
    </>
  );
}
