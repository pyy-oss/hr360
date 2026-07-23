import { z } from 'zod';

export const KnowledgeCategory = z.enum([
  'reglement', 'convention', 'procedure', 'note_rh', 'faq', 'autre',
]);

// Document de référence de la base de connaissances RH (source citable par le RAG).
export const KnowledgeDocInput = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(200),
  category: KnowledgeCategory,
  content: z.string().min(1).max(20000),
});
export type KnowledgeDocInput = z.infer<typeof KnowledgeDocInput>;
