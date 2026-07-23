import { z } from 'zod';

export const DocumentCategory = z.enum(['bulletin', 'attestation', 'contrat', 'autre']);

export const RegisterDocumentInput = z.object({
  employeeId: z.string().min(1),
  category: DocumentCategory,
  name: z.string().min(1).max(200),
  storagePath: z.string().min(1).max(500),
});
export type RegisterDocumentInput = z.infer<typeof RegisterDocumentInput>;

export const DeleteDocumentInput = z.object({ id: z.string().min(1) });
export type DeleteDocumentInput = z.infer<typeof DeleteDocumentInput>;

export const DOCUMENT_CATEGORY_LABEL: Record<string, string> = {
  bulletin: 'Bulletin de paie', attestation: 'Attestation', contrat: 'Contrat', autre: 'Autre',
};
