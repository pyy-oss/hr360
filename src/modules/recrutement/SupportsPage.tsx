import { useState } from 'react';

const TABS = [
  { key: 'tech', av: 'TL', label: 'Tech Lead — Sécurité' },
  { key: 'rh', av: 'RH', label: 'Responsable RH' },
  { key: 'mgr', av: 'MG', label: 'Manager Cyber' },
];

const GRILLE: [string, string, string][] = [
  ['Expertise sécurité offensive', '×3', 'Tech Lead'],
  ['Maîtrise conformité ISO / EBIOS', '×3', 'Tech Lead'],
  ['Posture conseil & vulgarisation', '×2', 'Manager'],
  ['Adéquation culture & motivation', '×2', 'RH'],
];

type Q = { n: string; txt: string; tags: string[]; look?: string };
const PANES: Record<string, { title: string; qs: Q[] }> = {
  tech: {
    title: 'Guide — Tech Lead Sécurité',
    qs: [
      { n: 'Q1', txt: 'Décrivez votre méthodologie de pentest de bout en bout, de la reconnaissance au rapport.', tags: ['Technique', 'Must-have'], look: 'À écouter : structure méthodo (OWASP/PTES), gestion des preuves, priorisation.' },
      { n: 'Q5', txt: 'Ciblée : votre expérience des cadres réglementaires bancaires locaux (UEMOA, BCEAO) ?', tags: ['Zone à confirmer', 'issu du 360°'] },
    ],
  },
  rh: {
    title: 'Guide — Responsable RH',
    qs: [
      { n: 'Q1', txt: "Qu'est-ce qui vous attire spécifiquement chez Neurones plutôt qu'un cabinet international ?", tags: ['Motivation'] },
      { n: 'Q4', txt: 'Ciblée : comment vous projetez-vous dans 3 ans ? Attentes d\'évolution et de rémunération ?', tags: ['Zone à confirmer'] },
    ],
  },
  mgr: {
    title: 'Guide — Manager Cyber',
    qs: [
      { n: 'Q3', txt: 'Ciblée : décrivez une mission en équipe. Votre rôle, la gestion des désaccords ?', tags: ['Zone à confirmer'] },
      { n: 'Q2', txt: "Un client conteste vos conclusions d'audit devant son COMEX. Comment réagissez-vous ?", tags: ['Mise en situation'] },
    ],
  },
};

export function SupportsPage() {
  const [tab, setTab] = useState('tech');
  const pane = PANES[tab];
  return (
    <>
      <div className="page-head">
        <h1>Supports d'entretien</h1>
        <p>Candidat retenu : <b>Aïcha Koné</b>. Grille de notation commune et guide d'entretien <b>différencié par membre du jury</b>.</p>
      </div>

      <div className="jury-tabs">
        {TABS.map((t) => (
          <div key={t.key} className={`jury-tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
            <div className="jt-av">{t.av}</div>{t.label}
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-head"><h3>Grille d'évaluation commune</h3><span className="sub">notée /5 · pondérée sur le référentiel</span></div>
        <table className="grille-table">
          <thead><tr><th>Critère</th><th>Poids</th><th>Évalué par</th><th style={{ textAlign: 'right' }}>Notation</th></tr></thead>
          <tbody>
            {GRILLE.map(([crit, poids, par]) => (
              <tr key={crit}>
                <td><b>{crit}</b></td>
                <td className="mono">{poids}</td>
                <td><span className="chip">{par}</span></td>
                <td><div className="scale" style={{ justifyContent: 'flex-end' }}>{[1, 2, 3, 4, 5].map((n) => <i key={n}>{n}</i>)}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="jury-pane active">
        <div className="section-t" style={{ marginTop: 0 }}>{pane.title}</div>
        {pane.qs.map((q) => (
          <div key={q.n} className="qbox">
            <div className="q-top"><span className="q-n">{q.n}</span><span className="q-txt">{q.txt}</span></div>
            <div className="q-meta">{q.tags.map((t) => <span key={t} className="q-tag">{t}</span>)}</div>
            {q.look && <div className="q-look">{q.look}</div>}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
        <button className="btn btn-primary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 15V3M7 10l5 5 5-5M5 21h14" /></svg>Exporter (PDF)</button>
        <button className="btn btn-ghost">Envoyer au jury</button>
      </div>
    </>
  );
}
