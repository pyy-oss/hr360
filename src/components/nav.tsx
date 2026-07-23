import { ReactNode } from 'react';
import type { Role } from '@/lib/rbac';

// Icône SVG au format de la maquette (fill:none, stroke:currentColor).
const ic = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);

// `roles` = rôles autorisés à VOIR l'entrée (confort de navigation ; la sécurité reste
// serveur). Absent ⇒ visible par tout utilisateur authentifié.
export interface NavItem { to: string; label: string; icon: ReactNode; roles?: Role[]; }
export interface NavSection { label: string; items: NavItem[]; }

// Groupes de rôles réutilisables.
const RH: Role[] = ['super_admin', 'drh', 'rh'];
const RECRUT: Role[] = ['super_admin', 'drh', 'rh', 'recruteur', 'manager'];
const STRAT: Role[] = ['super_admin', 'drh', 'dirigeant'];
const ANALYTICS: Role[] = ['super_admin', 'drh', 'rh', 'lecture', 'dirigeant'];

export const NAV: NavSection[] = [
  {
    label: 'Pilotage',
    items: [
      { to: '/', label: 'Tableau de bord', icon: ic(<><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></>) },
      { to: '/analytics', label: 'Analytics RH', roles: ANALYTICS, icon: ic(<><path d="M3 3v18h18" /><rect x="7" y="10" width="3" height="7" /><rect x="12" y="6" width="3" height="11" /><rect x="17" y="13" width="3" height="4" /></>) },
    ],
  },
  {
    label: 'Recrutement',
    items: [
      { to: '/postes', label: 'Postes & ouvertures', roles: RECRUT, icon: ic(<path d="M20 7h-3V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />) },
      { to: '/boite-rh', label: 'Boîte RH', roles: RECRUT, icon: ic(<><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 6 10-6" /></>) },
      { to: '/vivier', label: 'Vivier', roles: RECRUT, icon: ic(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>) },
      { to: '/scoring', label: 'Analyse & scoring', roles: RECRUT, icon: ic(<><path d="M3 3v18h18" /><path d="m7 14 3-4 4 3 5-7" /></>) },
      { to: '/profil', label: 'Profil 360°', roles: RECRUT, icon: ic(<><path d="M12 2 3 7l9 5 9-5-9-5Z" /><path d="M3 12l9 5 9-5" /><path d="M3 17l9 5 9-5" /></>) },
      { to: '/decision', label: 'Décision & jury', roles: RECRUT, icon: ic(<><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>) },
      { to: '/supports', label: "Supports d'entretien", roles: RECRUT, icon: ic(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M9 13h6M9 17h4" /></>) },
      { to: '/pilotage', label: 'Pilotage prédictif', roles: RECRUT, icon: ic(<path d="M22 12h-4l-3 9L9 3l-3 9H2" />) },
      { to: '/mobilite', label: 'Mobilité interne', roles: ['super_admin', 'drh', 'rh', 'recruteur', 'manager', 'dirigeant'], icon: ic(<><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" /></>) },
      { to: '/entretiens', label: 'Entretiens', roles: RECRUT, icon: ic(<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4" /></>) },
    ],
  },
  {
    label: 'Intégration',
    items: [
      { to: '/contrat', label: 'Contrat & embauche', roles: RH, icon: ic(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M9 15l2 2 4-4" /></>) },
      { to: '/onboarding', label: 'Onboarding', roles: ['super_admin', 'drh', 'rh', 'manager'], icon: ic(<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></>) },
      { to: '/essai', label: "Période d'essai", roles: RH, icon: ic(<><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>) },
    ],
  },
  {
    label: 'Gestion des talents',
    items: [
      { to: '/collaborateurs', label: 'Collaborateurs', roles: ['super_admin', 'drh', 'rh', 'lecture', 'dirigeant', 'manager'], icon: ic(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /></>) },
      { to: '/performance', label: 'Performance', roles: ['super_admin', 'drh', 'rh', 'manager', 'collaborateur'], icon: ic(<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1" /></>) },
      { to: '/competences', label: 'Compétences & carrières', roles: ['super_admin', 'drh', 'rh', 'dirigeant'], icon: ic(<path d="M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" />) },
      { to: '/formation', label: 'Formation', icon: ic(<><path d="M22 10 12 5 2 10l10 5 10-5Z" /><path d="M6 12v5c0 1 3 3 6 3s6-2 6-3v-5" /></>) },
      { to: '/staffing', label: 'Staffing & plan de charge', roles: ['super_admin', 'drh', 'rh', 'manager'], icon: ic(<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M8 4v16" /></>) },
    ],
  },
  {
    label: 'Vie du contrat',
    items: [
      { to: '/absences', label: 'Absences & congés', icon: ic(<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>) },
      { to: '/remuneration', label: 'Rémunération', roles: ['super_admin', 'drh', 'rh', 'manager', 'collaborateur'], icon: ic(<><circle cx="12" cy="12" r="9" /><path d="M14.5 9a2.5 2.5 0 0 0-2.5-1.5c-1.5 0-2.5 1-2.5 2s1 1.5 2.5 2 2.5 1 2.5 2-1 2-2.5 2A2.5 2.5 0 0 1 9.5 15M12 6v1.5M12 16.5V18" /></>) },
      { to: '/engagement', label: 'Engagement & climat', roles: RH, icon: ic(<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />) },
      { to: '/offboarding', label: 'Offboarding', roles: ['super_admin', 'drh', 'rh', 'manager'], icon: ic(<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />) },
      { to: '/documents', label: 'Coffre-fort documentaire', icon: ic(<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12h6M9 16h4M9 8h6" /></>) },
    ],
  },
  {
    label: 'Intelligence IA',
    items: [
      { to: '/agent', label: 'Copilote agentique', icon: ic(<><rect x="4" y="7" width="16" height="12" rx="2" /><path d="M12 7V4M8 3h8M9 13h.01M15 13h.01M8 17h8" /></>) },
      { to: '/prediction', label: 'Prédiction & rétention', roles: STRAT, icon: ic(<><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></>) },
      { to: '/workforce', label: 'Workforce planning IA', roles: STRAT, icon: ic(<path d="M4 20v-6M4 10V4M12 20v-9M12 7V4M20 20v-4M20 12V4M1 14h6M9 7h6M17 16h6" />) },
      { to: '/skills-ai', label: 'Intelligence des compétences', roles: ['super_admin', 'drh', 'rh', 'dirigeant'], icon: ic(<><circle cx="5" cy="6" r="2" /><circle cx="19" cy="6" r="2" /><circle cx="12" cy="18" r="2" /><path d="M7 6h10M6.5 8l4.5 8M17.5 8l-4.5 8" /></>) },
      { to: '/studio', label: 'Studio de génération', roles: RECRUT, icon: ic(<><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /><circle cx="12" cy="12" r="2" /></>) },
      { to: '/knowledge', label: 'Base de connaissances', icon: ic(<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>) },
      { to: '/gouvernance-ia', label: "Gouvernance de l'IA", roles: STRAT, icon: ic(<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></>) },
    ],
  },
  {
    label: 'Conformité & config',
    items: [
      { to: '/equite', label: 'Équité & audit', roles: STRAT, icon: ic(<path d="M12 3v18M5 7h14M7 7l-3 6h6zM17 7l-3 6h6z" />) },
      { to: '/assistant', label: 'Assistant RH', icon: ic(<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />) },
    ],
  },
];

/** Une entrée est-elle visible pour ce rôle ? (absence de `roles` ⇒ visible par tous). */
export function navItemVisible(item: NavItem, role: Role | undefined): boolean {
  if (!item.roles) return true;
  return !!role && item.roles.includes(role);
}

/** Sections filtrées pour un rôle (les sections vides sont retirées). */
export function navForRole(role: Role | undefined): NavSection[] {
  return NAV
    .map((s) => ({ ...s, items: s.items.filter((i) => navItemVisible(i, role)) }))
    .filter((s) => s.items.length > 0);
}

// Libellé de fil d'ariane par chemin.
export const CRUMB: Record<string, string> = Object.fromEntries(
  NAV.flatMap((s) => s.items.map((i) => [i.to, i.label])),
);
