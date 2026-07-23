import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../lib/admin';
import { assertDeptManagerOrHR, assertSameOrg, getClaims } from '../lib/rbac';
import { writeAudit } from '../lib/audit';
import { FieldValue } from 'firebase-admin/firestore';

const Weights = z.object({
  technique: z.number().int().min(0).max(100),
  experience: z.number().int().min(0).max(100),
  soft: z.number().int().min(0).max(100),
  formation: z.number().int().min(0).max(100),
}).refine((w) => w.technique + w.experience + w.soft + w.formation === 100, {
  message: 'La somme des pondérations doit valoir 100 %.',
});

const Schema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  departmentId: z.string().min(1),
  level: z.enum(['junior', 'confirme', 'senior', 'lead', 'manager']),
  contractType: z.enum(['cdi', 'cdd', 'stage', 'alternance', 'prestation']),
  openings: z.number().int().min(1).max(50).default(1),
  status: z.enum(['ouvert', 'en_cours', 'pourvu', 'gele', 'annule']).default('ouvert'),
  description: z.string().max(2000).optional(),
  mustSkills: z.array(z.string().min(1)).max(20).default([]),
  niceSkills: z.array(z.string().min(1)).max(20).default([]),
  excludedCriteria: z.array(z.string().min(1)).max(20).default([]),
  weights: Weights.optional(),
});

/** Crée ou met à jour un poste (RH/DRH ou manager du département). Audit. */
export const upsertPosition = onCall(async (req) => {
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', p.error.issues[0]?.message ?? 'Poste invalide.');
  const { id, ...data } = p.data;

  const c = getClaims(req);
  const ref = id ? db.doc(`positions/${id}`) : db.collection('positions').doc();
  if (id) {
    const existing = await ref.get();
    if (!existing.exists) throw new HttpsError('not-found', 'Poste introuvable.');
    assertSameOrg(c, existing.get('orgId'));
    // Droits fondés sur le département EXISTANT : empêche de détourner un poste d'un
    // autre département vers le sien.
    assertDeptManagerOrHR(req, existing.get('departmentId'));
  }
  // Droits sur le département cible (création, ou déplacement autorisé).
  assertDeptManagerOrHR(req, data.departmentId);

  const payload: Record<string, unknown> = { orgId: c.orgId, ...data, updatedAt: FieldValue.serverTimestamp() };
  if (!id) payload.createdAt = FieldValue.serverTimestamp();
  await ref.set(payload, { merge: true });

  await writeAudit({
    actor: { uid: req.auth!.uid, claims: c },
    action: id ? 'update_position' : 'create_position', resource: 'positions', resourceId: ref.id,
    after: { title: data.title, status: data.status, departmentId: data.departmentId },
  });
  return { ok: true, id: ref.id };
});
