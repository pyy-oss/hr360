import { Mini } from '@/components/mq';

export function SkillsAiPage() {
  return (
    <>
      <div className="page-head">
        <h1>Intelligence des compétences</h1>
        <p>Un moteur sémantique qui comprend les compétences au-delà des mots-clés — pour relier les talents aux missions et anticiper les pénuries.</p>
        <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>Module IA #40</span>
      </div>
      <div className="grid g2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-head"><h3>Matching sémantique talent ↔ mission</h3><span className="feat">#40</span></div>
          <div className="card-pad">
            <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: 12 }}>« Audit de SI bancaire » et « revue de conformité PCI-DSS » sont reconnus comme proches, même sans mot commun.</div>
            <div className="cand" style={{ padding: '12px 0' }}><div className="c-av" style={{ background: 'var(--signal-deep)', color: '#fff' }}>SK</div><div style={{ flex: 1 }}><div className="c-name">S. K. → Audit banque</div><div className="c-meta">correspondance sémantique</div></div><span className="score-badge sb-high">88 %</span></div>
            <div className="cand" style={{ padding: '12px 0', border: 'none' }}><div className="c-av" style={{ background: 'var(--signal-deep)', color: '#fff' }}>HB</div><div style={{ flex: 1 }}><div className="c-name">H. B. → Conseil GRC</div><div className="c-meta">correspondance sémantique</div></div><span className="score-badge sb-high">81 %</span></div>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Prévision de pénurie de compétences</h3></div>
          <div className="card-pad">
            <Mini lab="Sécurité cloud" w={80} bg="var(--low)" val="Tension" />
            <Mini lab="Pentest avancé" w={60} bg="var(--mid)" val="À surveiller" />
            <Mini lab="Conformité ISO" w={25} bg="var(--high)" val="Couvert" />
            <div style={{ fontSize: '11.5px', color: 'var(--muted-2)', marginTop: 8 }}>Croisé avec le pipeline commercial et les départs prévus.</div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-head"><h3>Recommandations de développement personnalisées</h3><span className="feat">#41</span></div>
        <div className="card-pad">
          <div className="hyp"><div className="h-ic" style={{ background: 'var(--signal-soft)', color: 'var(--signal-deep)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2 2 7l10 5 10-5-10-5Z" /></svg></div><div><b>S. K. → objectif Consultant senior</b><p style={{ fontSize: '12.5px', color: 'var(--muted)' }}>Parcours suggéré : certification pentest + module leadership de mission.</p></div></div>
          <div className="hyp" style={{ border: 'none' }}><div className="h-ic" style={{ background: 'var(--signal-soft)', color: 'var(--signal-deep)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2 2 7l10 5 10-5-10-5Z" /></svg></div><div><b>Aïcha K. → combler le contexte local</b><p style={{ fontSize: '12.5px', color: 'var(--muted)' }}>Module réglementation UEMOA/BCEAO + binôme avec un senior local.</p></div></div>
        </div>
      </div>
    </>
  );
}
