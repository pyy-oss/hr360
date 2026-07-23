import { Mini, TL } from '@/components/mq';

export function PerformancePage() {
  return (
    <>
      <div className="page-head">
        <h1>Performance &amp; objectifs</h1>
        <p>Objectifs suivis en continu, entretiens cadrés et feedback régulier — la performance se pilote toute l'année, pas une fois par an.</p>
        <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>Module #27</span>
      </div>
      <div className="grid g2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-head"><h3>Objectifs de l'équipe Cyber</h3><span className="sub">cycle en cours</span></div>
          <div className="card-pad">
            <Mini lab="Réduire le délai d'audit" w={72} bg="var(--signal)" val="72 %" />
            <Mini lab="Certifier 3 consultants" w={66} bg="var(--signal)" val="2 / 3" />
            <Mini lab="Satisfaction client ≥ 4,5" w={90} bg="var(--high)" val="4,6" />
            <Mini lab="Taux d'occupation cible" w={87} bg="var(--signal-deep)" val="87 %" />
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Cycle d'entretiens annuels</h3></div>
          <div className="card-pad">
            <TL items={[
              { dot: 'done', title: 'Auto-évaluation', sub: '98 % complétées' },
              { dot: '', title: 'Entretiens managers', sub: '62 % réalisés' },
              { dot: 'wait', title: 'Synthèse & décisions', sub: 'carrière, formation, rémunération' },
            ]} />
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-head"><h3>Feedback continu</h3></div>
        <div className="card-pad">
          <div className="hyp"><div className="h-ic" style={{ background: 'var(--high-soft)', color: 'var(--high)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M7 10v12M15 5.88 14 10h5.83a2 2 0 0 1 2 2.4l-1.4 7A2 2 0 0 1 18.5 21H7" /></svg></div><div><b>Reconnaissance — mission client</b><p style={{ fontSize: '12.5px', color: 'var(--muted)' }}>« Livrable d'audit clair et pédagogique, très apprécié du COMEX client. »</p></div></div>
          <div className="hyp" style={{ border: 'none' }}><div className="h-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg></div><div><b>Axe de progrès — manager</b><p style={{ fontSize: '12.5px', color: 'var(--muted)' }}>« Continuer à déléguer davantage sur les missions en équipe. »</p></div></div>
        </div>
      </div>
    </>
  );
}
