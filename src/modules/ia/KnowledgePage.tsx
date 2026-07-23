export function KnowledgePage() {
  return (
    <>
      <div className="page-head">
        <h1>Base de connaissances RH</h1>
        <p>Un assistant qui répond aux questions de politique RH en s'appuyant sur vos documents internes et la convention collective — avec les sources citées.</p>
        <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>Module IA #43</span>
      </div>
      <div className="chat">
        <div className="msg u"><div className="m-av usr">RH</div><div className="m-body">Quelle est la procédure de validation des congés au-delà de 10 jours ?</div></div>
        <div className="msg"><div className="m-av ai">IA</div><div className="m-body">Au-delà de 10 jours consécutifs, la demande requiert la validation du manager <b>et</b> de la DRH, avec un préavis de 15 jours.<br /><span style={{ fontSize: '11.5px', color: 'var(--signal-deep)' }}>Source : Règlement intérieur Neurones · §4.2 &nbsp;·&nbsp; Note RH 2025-08</span></div></div>
        <div className="msg u"><div className="m-av usr">RH</div><div className="m-body">Quelle durée de préavis pour un cadre en CDI ?</div></div>
        <div className="msg"><div className="m-av ai">IA</div><div className="m-body">La durée applicable dépend de la convention collective et de l'ancienneté.<br /><span style={{ fontSize: '11.5px', color: 'var(--signal-deep)' }}>Source : Convention collective · catégorie cadres</span><br /><span style={{ fontSize: 12, color: 'var(--muted-2)' }}>Point sensible : à confirmer avec la DRH / le juriste avant application.</span></div></div>
        <div className="chat-input"><div className="ci">Poser une question à la base de connaissances…</div><button className="btn btn-primary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="m22 2-7 20-4-9-9-4z" /></svg></button></div>
      </div>
      <div className="note" style={{ marginTop: 16 }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>Réponses ancrées dans les documents sources et citées — ce qui limite les hallucinations. L'IA ne se substitue pas à un avis juridique.</div>
    </>
  );
}
