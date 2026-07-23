import { ReactNode, ReactElement, cloneElement, useId } from 'react';

/**
 * Champ de formulaire accessible : associe le label à son contrôle via
 * htmlFor/id (généré). L'unique enfant (input/select) reçoit l'`id` et
 * `aria-invalid` si `invalid`. Style hérité de la maquette (.flabel/.field).
 */
export function Field({ label, children, hint, invalid, style }: {
  label: string;
  children: ReactElement;
  hint?: string;
  invalid?: boolean;
  style?: React.CSSProperties;
}) {
  const id = useId();
  return (
    <div style={style}>
      <label className="flabel" htmlFor={id}>{label}</label>
      {cloneElement(children, { id, 'aria-invalid': invalid || undefined })}
      {hint && <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 3 }}>{hint}</div>}
    </div>
  );
}

/** Carte KPI de la maquette. */
export function Kpi({ val, lab, delta, deltaTone = 'up', icon }: {
  val: string; lab: string; delta?: string; deltaTone?: 'up' | 'dn'; icon?: ReactNode;
}) {
  return (
    <div className="card kpi">
      {icon && <div className="k-top"><div className="k-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">{icon}</svg></div></div>}
      <div className="k-val display">{val}</div>
      <div className="k-lab">{lab}</div>
      {delta && <div className={`k-delta ${deltaTone}`}>{delta}</div>}
    </div>
  );
}

/** Ligne « mini » (label + barre + valeur). */
export function Mini({ lab, w, bg, val, labW }: { lab: string; w: number; bg: string; val: string; labW?: number }) {
  return (
    <div className="mini">
      <span className="m-lab" style={labW ? { width: labW } : undefined}>{lab}</span>
      <div className="m-track"><div className="mf" style={{ width: `${w}%`, background: bg }} /></div>
      <span className="m-val">{val}</span>
    </div>
  );
}

/** Puce de statut colorée réutilisable. */
export function StateChip({ tone, children }: { tone: 'ok' | 'mid' | 'low'; children: ReactNode }) {
  if (tone === 'ok') return <span className="chip on ref-w" style={{ marginLeft: 'auto' }}>{children}</span>;
  const c = tone === 'mid'
    ? { background: 'var(--mid-soft)', color: 'var(--mid)' }
    : { background: 'var(--low-soft)', color: 'var(--low)' };
  return <span className="chip ref-w" style={{ marginLeft: 'auto', border: 'none', ...c }}>{children}</span>;
}

/**
 * Bandeau d'erreur réutilisable. À placer sous l'en-tête d'une page pour
 * surfacer une erreur de chargement (query) ou d'action (mutation) plutôt
 * que d'échouer en silence. N'affiche rien si `error` est nul.
 */
export function ErrBar({ error, prefix }: { error: unknown; prefix?: string }) {
  if (!error) return null;
  const msg = error instanceof Error ? error.message : String(error);
  return (
    <div className="alert" role="alert" style={{ marginBottom: 16, background: 'var(--low-soft)', color: 'var(--low)', border: 'none' }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
      <div>{prefix ?? 'Une erreur est survenue.'} {msg}</div>
    </div>
  );
}

/** Timeline verticale. */
export function TL({ items }: { items: { dot?: 'done' | 'wait' | ''; title: string; sub: string }[] }) {
  return (
    <div className="tl">
      {items.map((it) => (
        <div key={it.title} className="tl-item">
          <div className={`tl-dot${it.dot ? ' ' + it.dot : ''}`} />
          <b style={{ fontSize: 13 }}>{it.title}</b>
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>{it.sub}</p>
        </div>
      ))}
    </div>
  );
}
