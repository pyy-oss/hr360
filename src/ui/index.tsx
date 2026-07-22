import { ReactNode, HTMLAttributes } from 'react';

// Bibliothèque de composants Neurones HR 360 — alignée sur la maquette de référence.

type Div = HTMLAttributes<HTMLDivElement>;
const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

/** En-tête de page : titre display + sous-titre + actions optionnelles. */
export function PageHead(
  { title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode },
) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-display font-semibold text-ink tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

/** Carte de surface. */
export function Card({ className, children, ...rest }: Div) {
  return (
    <div className={cx('bg-surface border border-line rounded-2xl shadow-card', className)} {...rest}>
      {children}
    </div>
  );
}
export function CardHead({ title, aside }: { title: string; aside?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-line">
      <h3 className="font-display font-semibold text-ink">{title}</h3>
      {aside && <div className="text-sm text-muted-2">{aside}</div>}
    </div>
  );
}
export function CardBody({ className, children, ...rest }: Div) {
  return <div className={cx('p-5', className)} {...rest}>{children}</div>;
}

/** Bouton. variant: primary | ghost | subtle. */
export function Button(
  { variant = 'primary', className, children, ...rest }:
  { variant?: 'primary' | 'ghost' | 'subtle' } & React.ButtonHTMLAttributes<HTMLButtonElement>,
) {
  const styles = {
    primary: 'bg-signal text-white hover:bg-signal-deep',
    ghost: 'border border-line text-ink hover:bg-canvas',
    subtle: 'bg-signal-soft text-signal-deep hover:bg-signal/20',
  }[variant];
  return (
    <button
      className={cx('inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium',
        'transition disabled:opacity-50 disabled:cursor-not-allowed', styles, className)}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Champ de formulaire (label + contrôle). */
export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="text-muted">{label}</span>
      <div className="mt-1">{children}</div>
      {error && <span className="text-low text-xs mt-1 block">{error}</span>}
    </label>
  );
}
const control = 'w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-signal/30 focus:border-signal';
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(control, props.className)} />;
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx(control, props.className)} />;
}

/** Badge de statut. tone: neutral | teal | ok | warn | danger | gold. */
export function Badge(
  { tone = 'neutral', children }: { tone?: 'neutral' | 'teal' | 'ok' | 'warn' | 'danger' | 'gold'; children: ReactNode },
) {
  const styles = {
    neutral: 'bg-canvas text-muted border-line',
    teal: 'bg-signal-soft text-signal-deep border-transparent',
    ok: 'bg-high/10 text-high border-transparent',
    warn: 'bg-mid/10 text-mid border-transparent',
    danger: 'bg-low/10 text-low border-transparent',
    gold: 'bg-gold/10 text-gold border-transparent',
  }[tone];
  return (
    <span className={cx('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', styles)}>
      {children}
    </span>
  );
}

/** Barre de progression (mini-bar de la maquette). */
export function Bar({ value, tone = 'teal' }: { value: number; tone?: 'teal' | 'ok' | 'warn' | 'danger' }) {
  const bg = { teal: 'bg-signal', ok: 'bg-high', warn: 'bg-mid', danger: 'bg-low' }[tone];
  return (
    <div className="h-2 rounded-full bg-line overflow-hidden">
      <div className={cx('h-full rounded-full', bg)} style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }} />
    </div>
  );
}

/** Tableau stylé : en-têtes + lignes. */
export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <table className="w-full text-sm">
        <thead className="bg-canvas text-left text-muted">
          <tr>{head.map((h) => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}
export function Row({ children }: { children: ReactNode }) {
  return <tr className="hover:bg-canvas/60 transition">{children}</tr>;
}
export function Cell({ className, children }: Div) {
  return <td className={cx('px-5 py-3', className)}>{children}</td>;
}

/** Encart d'information. tone: info | ok | warn. */
export function Notice(
  { tone = 'info', children }: { tone?: 'info' | 'ok' | 'warn'; children: ReactNode },
) {
  const styles = {
    info: 'bg-signal-soft text-signal-deep',
    ok: 'bg-high/10 text-high',
    warn: 'bg-mid/10 text-mid',
  }[tone];
  return <div className={cx('rounded-xl px-4 py-3 text-sm', styles)}>{children}</div>;
}

/** Étiquette de section mono (traçabilité type #tag de la maquette). */
export function Tag({ children }: { children: ReactNode }) {
  return <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-ink text-signal">{children}</span>;
}
