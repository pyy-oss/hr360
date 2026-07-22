import { HttpsError, CallableRequest } from 'firebase-functions/v2/https';

export type Role = 'super_admin' | 'drh' | 'rh' | 'manager' | 'collaborateur' | 'lecture';

export interface Claims {
  role: Role;
  orgId: string;
  employeeId?: string;
  departmentId?: string;
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

/** Exige d'être manager du département donné, OU un rôle RH/DRH/admin. */
export function assertDeptManagerOrHR(req: CallableRequest, departmentId: string): Claims {
  const c = getClaims(req);
  const isHR = ['super_admin', 'drh', 'rh'].includes(c.role);
  const isMgr = c.role === 'manager' && c.departmentId === departmentId;
  if (!isHR && !isMgr) {
    throw new HttpsError('permission-denied', "Réservé au manager du département ou à la RH.");
  }
  return c;
}
