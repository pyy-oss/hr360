import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { functions, db } from '@/lib/firebase';
import { useAuth } from '@/auth/AuthProvider';
import type { TrainingPlanInput, EnrollmentUpdateInput } from '@/types';

const createPlanFn = httpsCallable(functions, 'createTrainingPlan');
const updateEnrollmentFn = httpsCallable(functions, 'updateEnrollment');

export interface TrainingPlanRow { id: string; name: string; departmentId?: string; progressPct: number; }
export interface CatalogRow { id: string; name: string; tag?: string; }

/** Plans de formation de l'organisation. */
export function useTrainingPlans() {
  const { orgId } = useAuth();
  return useQuery<TrainingPlanRow[]>({
    queryKey: ['training', 'plans', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, 'trainingPlans'), where('orgId', '==', orgId), limit(100)));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TrainingPlanRow, 'id'>) }));
    },
  });
}

/** Catalogue de formation interne (org). */
export function useTrainingCatalog() {
  const { orgId } = useAuth();
  return useQuery<CatalogRow[]>({
    queryKey: ['training', 'catalog', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, 'trainingCatalog'), where('orgId', '==', orgId), limit(100)));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CatalogRow, 'id'>) }));
    },
  });
}

/** Besoins de formation de mon département (paginés). */
export function useDepartmentNeeds() {
  const { departmentId } = useAuth();
  return useQuery({
    queryKey: ['training', 'needs', departmentId],
    enabled: !!departmentId,
    queryFn: async () => {
      const q = query(
        collection(db, 'trainingNeeds'),
        where('departmentId', '==', departmentId),
        orderBy('priority'),
        limit(50),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    },
  });
}

/** Mes inscriptions (collaborateur). */
export function useMyEnrollments() {
  const { employeeId } = useAuth();
  return useQuery({
    queryKey: ['training', 'enrollments', employeeId],
    enabled: !!employeeId,
    queryFn: async () => {
      const q = query(
        collection(db, 'enrollments'),
        where('employeeId', '==', employeeId),
        where('status', 'in', ['inscrit', 'en_cours', 'termine', 'certifie']),
        limit(50),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    },
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TrainingPlanInput) => createPlanFn(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['training'] }),
  });
}

export function useUpdateEnrollment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: EnrollmentUpdateInput) => updateEnrollmentFn(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['training', 'enrollments'] }),
  });
}
