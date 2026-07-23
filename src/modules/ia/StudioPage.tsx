import { ReactNode } from 'react';

const TOOLS: { icon: ReactNode; title: string; sub: string }[] = [
  { icon: <path d="M20 7h-3V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />, title: "Offre d'emploi", sub: 'à partir du référentiel de poste' },
  { icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /></>, title: 'Fiche de poste', sub: 'missions, compétences, niveau' },
  { icon: <><path d="M4 4h16v16H4z" /><path d="M8 8h8M8 12h8M8 16h5" /></>, title: "Compte-rendu d'entretien", sub: 'à partir des notes du jury' },
  { icon: <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />, title: 'Réponse candidat', sub: 'acceptation ou refus, avec tact' },
  { icon: <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />, title: 'Communication RH', sub: 'annonces internes, notes' },
  { icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M9 15l2 2 4-4" /></>, title: "Lettre d'embauche", sub: 'variantes de ton' },
];

export function StudioPage() {
  return (
    <>
      <div className="page-head">
        <h1>Studio de génération</h1>
        <p>Un atelier de rédaction assistée : offres, fiches de poste, courriers, comptes-rendus et communications RH — générés en un instant, revus par un humain.</p>
        <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>Module IA #42</span>
      </div>
      <div className="grid g3" style={{ marginBottom: 16 }}>
        {TOOLS.map((t) => (
          <div key={t.title} className="card card-pad" style={{ cursor: 'pointer' }}>
            <div className="k-ic" style={{ marginBottom: 10 }}><svg viewBox="0 0 24 24" width={17} height={17} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">{t.icon}</svg></div>
            <b style={{ fontSize: '13.5px' }}>{t.title}</b>
            <div style={{ fontSize: 12, color: 'var(--muted-2)', marginTop: 2 }}>{t.sub}</div>
          </div>
        ))}
      </div>
      <div className="note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2 2 7l10 5 10-5-10-5Z" /></svg>Tout contenu généré est un brouillon soumis à relecture humaine. Les documents s'appuient sur les données réelles du dossier — pas d'informations inventées.</div>
    </>
  );
}
