import { db } from './admin';
import { FieldValue } from 'firebase-admin/firestore';
import { Claims } from './rbac';

/** Écrit une entrée d'audit append-only. À appeler dans chaque mutation sensible. */
export async function writeAudit(params: {
  actor: { uid: string; claims: Claims };
  action: string;
  resource: string;
  resourceId: string;
  before?: unknown;
  after?: unknown;
}) {
  await db.collection('auditLogs').add({
    orgId: params.actor.claims.orgId,
    actorUid: params.actor.uid,
    actorRole: params.actor.claims.role,
    action: params.action,
    resource: params.resource,
    resourceId: params.resourceId,
    before: params.before ?? null,
    after: params.after ?? null,
    at: FieldValue.serverTimestamp(),
  });
}
