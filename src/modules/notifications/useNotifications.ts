import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  collection, query, where, orderBy, limit, getDocs,
  doc, updateDoc, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/auth/AuthProvider';

/**
 * Notifications du destinataire connecté. Les règles Firestore n'autorisent la
 * lecture que de ses propres notifications (`toUid == request.auth.uid`) et la
 * seule mutation permise côté client est le passage à `read = true`. La création
 * est faite côté serveur (triggers). Aucune donnée n'est inventée ici.
 */

export type NotificationType = 'leave_decision' | 'leave_pending' | (string & {});

export interface AppNotification {
  id: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  read: boolean;
  createdAt: Date | null;
}

interface NotificationDoc {
  type?: string;
  payload?: Record<string, unknown>;
  read?: boolean;
  createdAt?: Timestamp;
}

export function useNotifications() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const listQuery = useQuery<AppNotification[]>({
    queryKey: ['notifications', user?.uid],
    enabled: !!user,
    queryFn: async () => {
      const snap = await getDocs(query(
        collection(db, 'notifications'),
        where('toUid', '==', user!.uid),
        orderBy('createdAt', 'desc'),
        limit(30),
      ));
      return snap.docs.map((d) => {
        const x = d.data() as NotificationDoc;
        return {
          id: d.id,
          type: (x.type ?? 'autre') as NotificationType,
          payload: x.payload ?? {},
          read: x.read === true,
          createdAt: x.createdAt instanceof Timestamp ? x.createdAt.toDate() : null,
        };
      });
    },
  });

  const items = listQuery.data ?? [];
  const unread = useMemo(() => items.filter((n) => !n.read).length, [items]);

  const markReadMutation = useMutation({
    mutationFn: (id: string) => updateDoc(doc(db, 'notifications', id), {
      read: true,
      readAt: serverTimestamp(),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', user?.uid] }),
  });

  return {
    items,
    unread,
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    markRead: (id: string) => markReadMutation.mutate(id),
    isMarking: markReadMutation.isPending,
  };
}
