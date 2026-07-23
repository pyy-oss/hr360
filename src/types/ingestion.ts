import { z } from 'zod';

export const IngestionType = z.enum(['documents', 'candidates']);
export const IngestionStatus = z.enum(['pending', 'processing', 'done', 'error']);

// Démarrage d'un import en masse. `documents` cible un collaborateur (coffre-fort) ;
// `candidates` alimente la Boîte RH (candidats en brouillon « à qualifier »).
export const StartIngestionJobInput = z.object({
  type: IngestionType,
  employeeId: z.string().optional(),   // requis pour type 'documents'
  positionId: z.string().optional(),   // optionnel pour type 'candidates'
  category: z.enum(['bulletin', 'attestation', 'contrat', 'autre']).optional(),
});
export type StartIngestionJobInput = z.infer<typeof StartIngestionJobInput>;

export interface IngestionJob {
  id: string;
  orgId: string;
  type: 'documents' | 'candidates';
  status: 'pending' | 'processing' | 'done' | 'error';
  employeeId?: string;
  positionId?: string;
  departmentId?: string;
  category?: string;
  total: number;
  processed: number;
  skipped: number;
  errors: string[];
}

// Types de fichiers acceptés dans une archive / un lot (le reste est ignoré).
export const INGEST_ACCEPTED_EXTENSIONS = ['pdf', 'doc', 'docx'] as const;
