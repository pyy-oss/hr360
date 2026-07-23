import { Mini, Kpi } from '@/components/mq';

export function EngagementPage() {
  return (
    <>
      <div className="page-head">
        <h1>Engagement &amp; climat</h1>
        <p>Écouter en continu pour agir tôt — enquêtes pulse, eNPS et plan d'actions, avant que la démotivation ne devienne un départ.</p>
        <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>Module #33</span>
      </div>
      <div className="grid g3" style={{ marginBottom: 16 }}>
        <Kpi val="+38" lab="eNPS collaborateurs" delta="▲ +6 pts" />
        <Kpi val="82 %" lab="Participation aux enquêtes" />
        <Kpi val="7,9" lab="Climat général / 10" />
      </div>
      <div className="grid g2">
        <div className="card">
          <div className="card-head"><h3>Résultats de l'enquête pulse</h3></div>
          <div className="card-pad">
            <Mini lab="Sens & fierté" w={86} bg="var(--high)" val="8,6" />
            <Mini lab="Management de proximité" w={78} bg="var(--signal)" val="7,8" />
            <Mini lab="Charge de travail" w={62} bg="var(--mid)" val="6,2" />
            <Mini lab="Perspectives d'évolution" w={70} bg="var(--signal)" val="7,0" />
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Plan d'actions</h3></div>
          <div className="card-pad">
            <div className="hyp"><div className="h-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2v20M2 12h20" /></svg></div><div><b>Charge de travail</b><p style={{ fontSize: '12.5px', color: 'var(--muted)' }}>Revoir le plan de staffing sur les missions en tension.</p></div></div>
            <div className="hyp" style={{ border: 'none' }}><div className="h-ic" style={{ background: 'var(--signal-soft)', color: 'var(--signal-deep)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2 2 7l10 5 10-5-10-5Z" /></svg></div><div><b>Perspectives</b><p style={{ fontSize: '12.5px', color: 'var(--muted)' }}>Clarifier les plans de carrière lors des entretiens annuels.</p></div></div>
          </div>
        </div>
      </div>
    </>
  );
}
