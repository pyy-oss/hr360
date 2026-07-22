import { ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { can, Resource, Action } from '@/lib/rbac';

/**
 * Garde de rendu — CONFORT UX. Cache un élément si le rôle courant n'a pas le droit.
 * La sécurité réelle reste côté serveur (règles + fonctions).
 */
export function RequirePermission(
  { resource, action, children, fallback = null }:
  { resource: Resource; action: Action; children: ReactNode; fallback?: ReactNode },
) {
  const { role } = useAuth();
  return can(role, resource, action) ? <>{children}</> : <>{fallback}</>;
}
