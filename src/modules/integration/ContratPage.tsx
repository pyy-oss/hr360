import { TL } from '@/components/mq';

const CHECK = <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="var(--high)" strokeWidth={2}><path d="M20 6 9 17l-5-5" /></svg>;
const CLAUSES = [
  'Fonctions, rattachement, lieu de travail',
  'Rémunération & éléments variables',
  "Période d'essai (durée selon convention)",
  'Confidentialité & sécurité (spécifique cyber)',
  'Déclaration CNPS & mentions du Code du travail',
];

export function ContratPage() {
  return (
    <>
      <div className="page-head">
        <h1>Contrat &amp; embauche</h1>
        <p>De la décision du jury à la signature : lettre d'embauche rédigée automatiquement, contrat pré-généré et signature électronique suivie.</p>
      </div>
      <div className="alert alert-info" style={{ marginBottom: 16 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20 6 9 17l-5-5" /></svg>
        <div><b>Nouvelle recrue — Aïcha Koné</b> · Consultant Cybersécurité · offre acceptée. Documents en préparation.</div>
      </div>
      <div className="grid g2">
        <div className="card">
          <div className="card-head"><h3>Lettre d'embauche</h3><span className="feat">#21</span></div>
          <div className="card-pad">
            <div style={{ border: '1px solid var(--line)', borderRadius: 10, padding: 18, background: '#FCFCFD', fontSize: '12.5px', lineHeight: 1.65 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}><b className="display" style={{ fontSize: 14 }}>Neurones Technologies SA</b><span style={{ color: 'var(--muted-2)', fontSize: 11 }}>Abidjan, le 22/07/2026</span></div>
              <p style={{ marginBottom: 8 }}><b>Objet :</b> Proposition d'embauche — Consultant Cybersécurité</p>
              <p style={{ marginBottom: 8 }}>Madame,</p>
              <p style={{ marginBottom: 8 }}>Nous avons le plaisir de vous confirmer notre proposition de collaboration au sein de notre pôle Cybersécurité &amp; Audit, au poste de Consultant Cybersécurité (niveau confirmé, palier 4).</p>
              <p style={{ marginBottom: 8, color: 'var(--muted-2)' }}>[Rémunération, date de prise de fonction et modalités selon la grille interne — champs fusionnés automatiquement.]</p>
              <p>Dans l'attente de votre retour, nous vous prions d'agréer…</p>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button className="btn btn-ghost"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z" /></svg>Ajuster le ton</button>
              <button className="btn btn-ghost">Exporter (PDF)</button>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Génération du contrat</h3><span className="feat">#22</span></div>
          <div className="card-pad">
            <div className="setting"><div className="st-txt"><b>Type de contrat</b><p>CDI / CDD selon le besoin.</p></div><div style={{ display: 'flex', gap: 6 }}><span className="chip on">CDI</span><span className="chip">CDD</span></div></div>
            <div className="section-t" style={{ margin: '14px 0 6px' }}>Clauses &amp; mentions incluses</div>
            {CLAUSES.map((c, i) => (
              <div key={c} className="ref-row" style={i === CLAUSES.length - 1 ? { border: 'none' } : undefined}>{CHECK}<span>{c}</span></div>
            ))}
            <div className="note" style={{ marginTop: 14 }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>Le contrat généré est un projet : les durées, clauses et mentions légales sont validées par la DRH / le juriste avant signature.</div>
          </div>
        </div>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-head"><h3>Signature électronique</h3><span className="sub">suivi du circuit</span></div>
        <div className="card-pad">
          <TL items={[
            { dot: 'done', title: 'Contrat généré', sub: 'projet prêt à relecture juridique' },
            { dot: 'done', title: 'Validation DRH', sub: 'clauses confirmées' },
            { dot: '', title: 'Envoi au candidat', sub: 'signature en attente' },
            { dot: 'wait', title: 'Contre-signature Neurones', sub: "déclenche l'onboarding" },
          ]} />
        </div>
      </div>
    </>
  );
}
