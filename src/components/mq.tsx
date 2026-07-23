import { ReactNode } from 'react';

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
