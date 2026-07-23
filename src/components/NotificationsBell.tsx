import { useEffect, useId, useRef, useState } from 'react';
import { useNotifications, type AppNotification } from '@/modules/notifications/useNotifications';

/** Traduit un statut brut de décision de congé en libellé lisible (fallback : brut). */
const DECISION_STATUS: Record<string, string> = {
  approuve: 'approuvée', approuvee: 'approuvée', valide: 'validée',
  refuse: 'refusée', refusee: 'refusée', annule: 'annulée', annulee: 'annulée',
};

/** Libellé lisible d'une notification selon son `type` et son `payload`. */
function notifLabel(n: AppNotification): string {
  switch (n.type) {
    case 'leave_decision': {
      const raw = String(n.payload.status ?? '');
      return `Votre demande de congé a été ${DECISION_STATUS[raw] ?? (raw || 'traitée')}`;
    }
    case 'leave_pending':
      return 'Une demande de congé attend votre validation';
    default:
      return 'Nouvelle notification';
  }
}

const fmtDate = (d: Date | null) =>
  d ? new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(d) : '';

export function NotificationsBell() {
  const { items, unread, isLoading, error, markRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  // Fermeture au clic extérieur et à la touche Échap.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        className="icon-btn"
        aria-label={`Notifications${unread > 0 ? ` (${unread} non lue${unread > 1 ? 's' : ''})` : ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {unread > 0 && (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, padding: '0 4px',
              display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, lineHeight: 1,
              color: '#fff', background: 'var(--low)', borderRadius: 20, border: '2px solid var(--panel)',
            }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Notifications"
          style={{
            position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 320, maxWidth: '80vw',
            background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12,
            boxShadow: 'var(--shadow)', overflow: 'hidden', zIndex: 40,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid var(--line-2)' }}>
            <b style={{ fontSize: 13 }}>Notifications</b>
            {unread > 0 && <span className="chip on" style={{ marginLeft: 'auto' }}>{unread} non lue{unread > 1 ? 's' : ''}</span>}
          </div>

          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {isLoading && <div style={{ fontSize: 12.5, color: 'var(--muted)', padding: '16px' }}>Chargement…</div>}
            {error && <div style={{ fontSize: 12.5, color: 'var(--low)', padding: '16px' }}>Chargement des notifications impossible.</div>}
            {!isLoading && !error && items.length === 0 && (
              <div style={{ fontSize: 12.5, color: 'var(--muted)', padding: '16px' }}>Aucune notification.</div>
            )}
            {items.map((n) => (
              <button
                key={n.id}
                role="menuitem"
                onClick={() => { if (!n.read) markRead(n.id); }}
                style={{
                  display: 'flex', gap: 10, width: '100%', textAlign: 'left', cursor: n.read ? 'default' : 'pointer',
                  padding: '12px 16px', border: 'none', borderBottom: '1px solid var(--line-2)',
                  background: n.read ? 'transparent' : 'var(--signal-soft)',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 5,
                    background: n.read ? 'var(--line)' : 'var(--signal)',
                  }}
                />
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 12.5, color: 'var(--text)', fontWeight: n.read ? 400 : 600 }}>{notifLabel(n)}</span>
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--muted-2)', marginTop: 2 }}>{fmtDate(n.createdAt)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
