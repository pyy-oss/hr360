import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ref, uploadBytes } from 'firebase/storage';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { callable, db, storage } from '@/lib/firebase';
import { useAuth } from '@/auth/AuthProvider';

const startFn = callable('startIngestionJob');
const processFn = callable('processIngestionJob');

export interface IngestionJobRow {
  id: string;
  type: 'documents' | 'candidates';
  status: 'pending' | 'processing' | 'done' | 'error';
  total: number; processed: number; skipped: number; errors: string[];
  employeeId?: string; positionId?: string;
}

export interface BulkIngestInput {
  type: 'documents' | 'candidates';
  employeeId?: string;
  positionId?: string;
  category?: 'bulletin' | 'attestation' | 'contrat' | 'autre';
  files: File[];
}

/** Nom de fichier sûr pour un chemin Storage. */
function safeName(name: string): string {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.\- ]+/g, '_').slice(0, 180);
}

/**
 * Import en masse : pour chaque fichier sélectionné (archive ZIP ou document), ouvre
 * un job serveur puis dépose le fichier dans la zone de transit Storage — ce qui
 * déclenche le traitement (décompression + enregistrement) côté serveur.
 */
export function useBulkIngest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: BulkIngestInput) => {
      let jobs = 0;
      for (const file of input.files) {
        const res = await startFn({
          type: input.type, employeeId: input.employeeId,
          positionId: input.positionId, category: input.category,
        });
        const { jobId, uploadPrefix } = res.data as { jobId: string; uploadPrefix: string };
        const path = `${uploadPrefix}${Date.now()}_${safeName(file.name)}`;
        await uploadBytes(ref(storage, path), file);
        // Déclenche le traitement serveur (décompression + enregistrement). Le job
        // passe en « processing » puis « done »/« error » ; le suivi se fait via la liste.
        await processFn({ jobId, storagePath: path }).catch(() => undefined);
        jobs += 1;
      }
      return { jobs };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ingestionJobs'] }),
  });
}

/** Jobs d'import récents de l'organisation (auto-rafraîchi tant qu'un job est en cours). */
export function useRecentIngestionJobs(type?: 'documents' | 'candidates') {
  const { orgId, role } = useAuth();
  const canSee = ['super_admin', 'drh', 'rh', 'recruteur'].includes(role ?? '');
  return useQuery<IngestionJobRow[]>({
    queryKey: ['ingestionJobs', orgId, type ?? 'all'],
    enabled: !!orgId && canSee,
    refetchInterval: (q) => (q.state.data?.some((j) => j.status === 'pending' || j.status === 'processing') ? 2500 : false),
    queryFn: async () => {
      const snap = await getDocs(query(
        collection(db, 'ingestionJobs'),
        where('orgId', '==', orgId), orderBy('createdAt', 'desc'), limit(15),
      ));
      const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<IngestionJobRow, 'id'>) }));
      return type ? rows.filter((r) => r.type === type) : rows;
    },
  });
}
