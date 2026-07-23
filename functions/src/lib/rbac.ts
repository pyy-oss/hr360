import { HttpsError, CallableRequest } from 'firebase-functions/v2/https';

export type Role =
  | 'super_admin' | 'drh' | 'rh' | 'recruteur'
  | 'manager' | 'collaborateur' | 'lecture' | 'dirigeant';

export interface Claims {
  role: Role;
  orgId: string;
  employeeId?: string;
  departmentId?: string;
  // Périmètre multi-départements (portefeuille HRBP, chapeau transverse Codir).
  departmentIds?: string[];
}

/** Le département fait-il partie du périmètre de l'acteur (mono ou multi) ? */
export function inDeptScope(c: Claims, departmentId: string): boolean {
  return c.departmentId === departmentId || (c.departmentIds ?? []).includes(departmentId);
}

/** Récupère les claims du token ou lève une erreur si non authentifié. */
export function getClaims(req: CallableRequest): Claims {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Authentification requise.');
  const t = req.auth.token as unknown as Claims;
  if (!t.role || !t.orgId) throw new HttpsError('permission-denied', 'Rôle non défini.');
  return t;
}

/** Exige l'un des rôles. */
export function assertRole(req: CallableRequest, roles: Role[]): Claims {
  const c = getClaims(req);
  if (!roles.includes(c.role)) {
    throw new HttpsError('permission-denied', "Droits insuffisants pour cette action.");
  }
  return c;
}

/**
 * Isolation multi-tenant : la ressource ciblée doit appartenir à l'organisation
 * de l'acteur. À appeler avec l'orgId LU sur le document existant (jamais celui
 * fourni par le client) avant toute mutation d'un document déjà présent.
 */
export function assertSameOrg(claims: Claims, resourceOrgId: unknown): void {
  if (!resourceOrgId || resourceOrgId !== claims.orgId) {
    throw new HttpsError('permission-denied', 'Ressource hors de votre organisation.');
  }
}

/** Exige d'être manager du département donné, OU un rôle RH/DRH/admin. */
export function assertDeptManagerOrHR(req: CallableRequest, departmentId: string): Claims {
  const c = getClaims(req);
  const isHR = ['super_admin', 'drh', 'rh'].includes(c.role);
  const isMgr = c.role === 'manager' && inDeptScope(c, departmentId);
  if (!isHR && !isMgr) {
    throw new HttpsError('permission-denied', "Réservé au manager du département ou à la RH.");
  }
  return c;
}
