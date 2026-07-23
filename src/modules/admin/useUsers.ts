import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { callable, db } from '@/lib/firebase';
import type { Role } from '@/lib/rbac';

const setUserRoleFn = callable('setUserRole');

export interface UserRow {
  id: string; email?: string; displayName?: string;
  role?: Role; departmentId?: string | null;
}

/** Liste des utilisateurs (reflet d'affichage). Lecture réservée RH/DRH par les règles. */
export function useUsers() {
  return useQuery<UserRow[]>({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const q = query(collection(db, 'users'), orderBy('email'), limit(100));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<UserRow, 'id'>) }));
    },
  });
}

export interface SetRoleInput {
  uid: string; role: Role; departmentId?: string; employeeId?: string;
}

/** Attribue un rôle via la fonction serveur (super_admin/drh). */
export function useSetUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SetRoleInput) => setUserRoleFn(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}
