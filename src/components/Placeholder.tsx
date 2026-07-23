export function Placeholder({ title, desc }: { title: string; desc?: string }) {
  return (
    <>
      <div className="page-head"><h1>{title}</h1>{desc && <p>{desc}</p>}</div>
      <div className="card">
        <div className="placeholder">
          <div className="ph-ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /><circle cx="12" cy="12" r="2" />
            </svg>
          </div>
          <h2>Écran en construction</h2>
          <p>Cet écran est reproduit progressivement, fidèle à la maquette. Le socle, la sécurité (RBAC) et le déploiement sont déjà en place.</p>
        </div>
      </div>
    </>
  );
}
