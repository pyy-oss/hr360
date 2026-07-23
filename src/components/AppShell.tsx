import { ReactNode, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/auth/AuthProvider';
import { navForRole, CRUMB } from './nav';

const navClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'nav-item active' : 'nav-item';

function initials(email?: string | null) {
  if (!email) return 'NT';
  const name = email.split('@')[0].replace(/[._-]/g, ' ').trim();
  const parts = name.split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || name.slice(0, 2).toUpperCase();
}

export function AppShell({ children }: { children: ReactNode }) {
  const { role, user } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const crumb = CRUMB[pathname] ?? 'Tableau de bord';

  return (
    <div className="mq">
      <div className="app">
        <aside className={`sidebar${open ? ' open' : ''}`} onClick={() => setOpen(false)}>
          <NavLink to="/" className="brand">
            <div className="brand-mark">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
                <path d="M4 12h4l2-6 4 12 2-6h4" />
              </svg>
            </div>
            <div className="brand-txt">
              <div className="display">Neurones IA</div>
              <small>Copilote RH · 2026</small>
            </div>
          </NavLink>

          {navForRole(role).map((section) => (
            <div key={section.label}>
              <div className="nav-label">{section.label}</div>
              {section.items.map((it) => (
                <NavLink key={it.to} to={it.to} end={it.to === '/'} className={navClass}>
                  {it.icon}
                  {it.label}
                </NavLink>
              ))}
            </div>
          ))}

          <div className="sidebar-foot">
            <div className="avatar">{initials(user?.email)}</div>
            <div style={{ minWidth: 0 }}>
              <b style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email?.split('@')[0] ?? 'Utilisateur'}
              </b>
              <small>{role ?? '—'} · Neurones</small>
            </div>
            <button className="logout" title="Se déconnecter" onClick={() => signOut(auth)}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </button>
          </div>
        </aside>

        <div className="main">
          <div className="topbar">
            <button className="icon-btn menu-toggle" onClick={() => setOpen((o) => !o)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 6h18M3 12h18M3 18h18" /></svg>
            </button>
            <div className="crumb">Neurones IA · <b>{crumb}</b></div>
            <div className="poste-pill">
              <span className="dot" />Poste actif&nbsp; <b>Consultant Cybersécurité — Confirmé</b>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="m6 9 6 6 6-6" /></svg>
            </div>
            <button className="icon-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
            </button>
          </div>
          <div className="content">
            <div className="screen" key={pathname}>{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
