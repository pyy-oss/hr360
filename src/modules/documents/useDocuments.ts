import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  collection, query, where, limit, getDocs, Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { callable, db, storage } from '@/lib/firebase';
import { useAuth } from '@/auth/AuthProvider';
import type { DocumentCategory } from '@/types';
import { z } from 'zod';

// Catégorie stockée = z.infer de l'enum DocumentCategory partagé (types/documents).
type Category = z.infer<typeof DocumentCategory>;

const registerFn = callable('registerEmployeeDocument');
const deleteFn = callable('deleteEmployeeDocument');

export interface DocumentRow {
  id: string;
  orgId: string;
  employeeId: string;
  category: Category;
  name: string;
  storagePath: string;
  uploadedByUid: string;
  createdAt?: Timestamp | null;
}

function mapDocs(snap: Awaited<ReturnType<typeof getDocs>>): DocumentRow[] {
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<DocumentRow, 'id'>) }));
}

/** Assainit le nom de fichier pour le chemin Storage (ASCII sûr, pas de séparateurs). */
function sanitizeFileName(name: string): string {
  const cleaned = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 120);
  return cleaned || 'fichier';
}

/** Documents du collaborateur connecté (règles : lecture de SES propres documents). */
function sortByCreatedDesc(rows: DocumentRow[]): DocumentRow[] {
  return [...rows].sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
}

export function useMyDocuments() {
  const { orgId, employeeId } = useAuth();
  return useQuery<DocumentRow[]>({
    queryKey: ['documents', 'mine', orgId, employeeId],
    enabled: !!employeeId && !!orgId,
    queryFn: async () => {
      const snap = await getDocs(query(
        collection(db, 'employeeDocuments'),
        where('orgId', '==', orgId),
        where('employeeId', '==', employeeId),
        limit(200),
      ));
      return sortByCreatedDesc(mapDocs(snap));
    },
  });
}

/** Documents d'un employé donné (RH/DRH). */
export function useEmployeeDocuments(employeeId?: string) {
  const { orgId } = useAuth();
  return useQuery<DocumentRow[]>({
    queryKey: ['documents', 'employee', orgId, employeeId],
    enabled: !!employeeId && !!orgId,
    queryFn: async () => {
      const snap = await getDocs(query(
        collection(db, 'employeeDocuments'),
        where('orgId', '==', orgId),
        where('employeeId', '==', employeeId),
        limit(200),
      ));
      return sortByCreatedDesc(mapDocs(snap));
    },
  });
}

export interface UploadDocumentInput {
  employeeId: string;
  category: Category;
  name: string;
  file: File;
}

/**
 * Dépôt d'un document : (1) upload Storage sous documents/{orgId}/{employeeId}/{ts}_{nom},
 * (2) enregistrement de la métadonnée via la callable registerEmployeeDocument, qui
 * revalide les droits côté serveur et écrit l'audit. Invalide ensuite les vues documents.
 */
export function useUploadDocument() {
  const qc = useQueryClient();
  const { orgId } = useAuth();
  return useMutation({
    mutationFn: async ({ employeeId, category, name, file }: UploadDocumentInput) => {
      if (!orgId) throw new Error('Organisation inconnue.');
      const fileName = `${Date.now()}_${sanitizeFileName(file.name)}`;
      const storagePath = `documents/${orgId}/${employeeId}/${fileName}`;
      await uploadBytes(ref(storage, storagePath), file);
      await registerFn({ employeeId, category, name, storagePath });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documents'] }); },
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFn({ id }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documents'] }); },
  });
}

/** URL de téléchargement signée d'un fichier Storage. */
export function getUrl(storagePath: string): Promise<string> {
  return getDownloadURL(ref(storage, storagePath));
}
