export function AgentPage() {
  return (
    <>
      <div className="page-head">
        <h1>Copilote agentique</h1>
        <p>Au-delà de répondre, l'IA <b>agit</b> : elle décompose une intention en étapes, les exécute et s'arrête aux points de validation humaine. Vous pilotez, l'agent opère.</p>
        <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>Module IA #35</span>
      </div>
      <div className="chat" style={{ marginBottom: 16 }}>
        <div className="msg u"><div className="m-av usr">YK</div><div className="m-body">Lance le recrutement des 2 consultants cyber pour l'audit banque, démarrage sous 3 semaines.</div></div>
        <div className="msg"><div className="m-av ai">IA</div><div className="m-body">Compris. Voici mon plan d'action — je m'arrête à chaque étape marquée « validation ».</div></div>
      </div>
      <div className="card">
        <div className="card-head"><h3>Plan d'exécution de l'agent</h3><span className="sub">human-in-the-loop</span></div>
        <div className="card-pad">
          <div className="tl">
            <div className="tl-item"><div className="tl-dot done" /><b style={{ fontSize: 13 }}>Ouvrir le poste depuis le référentiel</b><p style={{ fontSize: 12, color: 'var(--muted)' }}>Consultant Cybersécurité — fait automatiquement</p></div>
            <div className="tl-item"><div className="tl-dot done" /><b style={{ fontSize: 13 }}>Scanner le vivier &amp; la mobilité interne</b><p style={{ fontSize: 12, color: 'var(--muted)' }}>7 profils externes + 2 internes remontés</p></div>
            <div className="tl-item"><div className="tl-dot" /><b style={{ fontSize: 13 }}>Présélection à valider <span className="chip" style={{ background: 'var(--mid-soft)', color: 'var(--mid)', border: 'none' }}>Validation requise</span></b><p style={{ fontSize: 12, color: 'var(--muted)' }}>4 candidats proposés au jury</p></div>
            <div className="tl-item"><div className="tl-dot wait" /><b style={{ fontSize: 13 }}>Proposer des créneaux d'entretien</b><p style={{ fontSize: 12, color: 'var(--muted)' }}>via Outlook, dès validation</p></div>
            <div className="tl-item"><div className="tl-dot wait" /><b style={{ fontSize: 13 }}>Préparer grilles &amp; guides du jury</b><p style={{ fontSize: 12, color: 'var(--muted)' }}>générés à l'ouverture des entretiens</p></div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn btn-primary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20 6 9 17l-5-5" /></svg>Valider la présélection</button>
            <button className="btn btn-ghost">Ajuster</button>
          </div>
        </div>
      </div>
    </>
  );
}
