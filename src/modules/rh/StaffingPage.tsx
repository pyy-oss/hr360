import { Link } from 'react-router-dom';
import { Mini, Kpi, StateChip } from '@/components/mq';

export function StaffingPage() {
  return (
    <>
      <div className="page-head">
        <h1>Staffing &amp; plan de charge</h1>
        <p>Le cœur d'une société de services : affecter les bons consultants aux bonnes missions, suivre le taux d'occupation et anticiper les tensions.</p>
        <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>Module #30</span>
      </div>
      <div className="grid g4" style={{ marginBottom: 16 }}>
        <Kpi val="87 %" lab="Taux d'occupation (TACE)" delta="cible atteinte" />
        <Kpi val="42 / 48" lab="Consultants staffés" />
        <Kpi val="11" lab="Missions actives" />
        <Kpi val="6" lab="Sur le banc" delta="à repositionner" deltaTone="dn" />
      </div>
      <div className="grid g2">
        <div className="card">
          <div className="card-head"><h3>Affectation des consultants</h3></div>
          <div className="card-pad">
            <Mini lab="S. K. — Analyste SOC" w={100} bg="var(--signal-deep)" val="100 %" />
            <Mini lab="A. T. — Consultant Réseau" w={80} bg="var(--signal)" val="80 %" />
            <Mini lab="H. B. — Chargé d'audit" w={50} bg="var(--gold)" val="50 %" />
            <Mini lab="Aïcha K. — Consultante" w={30} bg="var(--muted-2)" val="30 %" />
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Missions à staffer</h3></div>
          <div className="card-pad">
            <div className="ref-row"><div><b style={{ fontSize: 13 }}>Audit sécurité — banque régionale</b><div style={{ fontSize: 12, color: 'var(--muted-2)' }}>démarrage sous 3 sem.</div></div><StateChip tone="low">2 profils manquants</StateChip></div>
            <div className="ref-row"><div><b style={{ fontSize: 13 }}>Déploiement SOC — télécom</b><div style={{ fontSize: 12, color: 'var(--muted-2)' }}>en cours</div></div><StateChip tone="ok">Complet</StateChip></div>
            <div className="ref-row" style={{ border: 'none' }}><div><b style={{ fontSize: 13 }}>Conseil GRC — assurance</b><div style={{ fontSize: 12, color: 'var(--muted-2)' }}>pipeline</div></div><StateChip tone="mid">1 profil à prévoir</StateChip></div>
            <div className="alert alert-warn" style={{ marginTop: 12, fontSize: 12 }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg><div>Tension de staffing détectée : déclenche le <Link to="/pilotage" style={{ textDecoration: 'underline' }}>recrutement prédictif →</Link></div></div>
          </div>
        </div>
      </div>
    </>
  );
}
