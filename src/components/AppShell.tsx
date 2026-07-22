import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/auth/AuthProvider';
import { can } from '@/lib/rbac';

const item = ({ isActive }: { isActive: boolean }) =>
  [
    'block px-3 py-2 rounded-xl text-sm font-medium transition',
    isActive ? 'bg-signal text-white shadow-card' : 'text-slate-300 hover:bg-white/10 hover:text-white',
  ].join(' ');

export function AppShell({ children }: { children: ReactNode }) {
  const { role, user } = useAuth();
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-ink text-white flex flex-col p-3">
        <div className="px-3 py-4">
          <div className="font-display font-semibold text-lg tracking-tight">Neurones HR 360</div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-mono uppercase tracking-wider">Espace RH</div>
        </div>
        <nav className="flex-1 space-y-1 mt-2">
          <NavLink to="/" end className={item}>Accueil</NavLink>
          <NavLink to="/collaborateurs" className={item}>Annuaire</NavLink>
          <NavLink to="/absences" className={item}>Absences &amp; congés</NavLink>
          <NavLink to="/formation" className={item}>Formation</NavLink>
          <NavLink to="/objectifs" className={item}>Objectifs &amp; évaluations</NavLink>
          <NavLink to="/staffing" className={item}>Staffing &amp; plan de charge</NavLink>
          {can(role, 'settings', 'update') && <NavLink to="/admin" className={item}>Administration</NavLink>}
        </nav>
        <div className="border-t border-white/10 pt-3 mt-3">
          <div className="px-3 mb-2">
            <div className="text-sm truncate">{user?.email}</div>
            <div className="text-[11px] text-signal font-mono uppercase tracking-wide">{role}</div>
          </div>
          <button onClick={() => signOut(auth)}
            className="w-full text-left px-3 py-2 rounded-xl text-sm text-slate-300 hover:bg-white/10 hover:text-white transition">
            Se déconnecter
          </button>
        </div>
      </aside>
      <main className="flex-1 bg-canvas overflow-auto">{children}</main>
    </div>
  );
}
