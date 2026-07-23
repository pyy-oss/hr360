import { Mini } from '@/components/mq';

export function PredictionPage() {
  return (
    <>
      <div className="page-head">
        <h1>Prédiction &amp; rétention</h1>
        <p>Détecter tôt les signaux — risque de départ, chances de réussite en poste — pour agir avant qu'il ne soit trop tard.</p>
        <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>Module IA #36</span>
      </div>
      <div className="alert alert-info" style={{ marginBottom: 16 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
        <div>Ces prédictions sont des <b>aides à la décision</b>, jamais des verdicts. Elles déclenchent des actions de soutien (échange carrière), jamais une mesure défavorable automatique.</div>
      </div>
      <div className="grid g2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-head"><h3>Risque de départ (attrition)</h3><span className="feat">#36</span></div>
          <div className="card-pad">
            <Mini lab="H. B. — Chargé d'audit" w={72} bg="var(--low)" val="Élevé" />
            <div style={{ fontSize: '11.5px', color: 'var(--muted-2)', margin: '-4px 0 12px 0' }}>Facteurs : perspectives d'évolution, solde de congés élevé</div>
            <Mini lab="A. T. — Consultant Réseau" w={40} bg="var(--mid)" val="Moyen" />
            <div style={{ fontSize: '11.5px', color: 'var(--muted-2)', margin: '-4px 0 12px 0' }}>Facteur : charge de travail sur missions en tension</div>
            <Mini lab="S. K. — Analyste SOC" w={15} bg="var(--high)" val="Faible" />
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Réussite en poste — nouvelle recrue</h3><span className="feat">#37</span></div>
          <div className="card-pad">
            <div style={{ textAlign: 'center', padding: '8px 0 4px' }}><div className="display" style={{ fontSize: 34, fontWeight: 600, color: 'var(--high)' }}>84 %</div><div style={{ fontSize: 12, color: 'var(--muted)' }}>probabilité de réussite à 6 mois — Aïcha Koné</div></div>
            <Mini lab="Adéquation compétences" w={90} bg="var(--high)" val="Fort +" />
            <Mini lab="Intégration équipe" w={66} bg="var(--gold)" val="À suivre" />
            <div className="note" style={{ marginTop: 12, fontSize: 12 }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>Jamais l'unique base d'une décision RH. Complète le jugement humain, ne le remplace pas.</div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-head"><h3>Signaux faibles — analyse de sentiment</h3><span className="feat">#38</span></div>
        <div className="card-pad">
          <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: 12 }}>L'IA analyse les verbatims (enquêtes, feedback) de façon <b>agrégée et anonyme</b> pour repérer les tendances avant qu'elles ne se traduisent en départs.</div>
          <Mini lab="Tonalité globale (30 j)" w={74} bg="var(--signal)" val="Positive" />
          <Mini lab="Thème « charge » en hausse" w={58} bg="var(--mid)" val="Vigilance" />
        </div>
      </div>
    </>
  );
}
