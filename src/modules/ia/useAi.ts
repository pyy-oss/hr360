import { useMutation, useQuery } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { functions, db } from '@/lib/firebase';
import { useAuth } from '@/auth/AuthProvider';

const assistantFn = httpsCallable(functions, 'aiAssistant');

export interface ChatTurn { role: 'user' | 'assistant'; content: string; }

/** Assistant RH conversationnel (appel Claude côté serveur). */
export function useAssistant() {
  return useMutation({
    mutationFn: async (input: { message: string; history?: ChatTurn[] }) => {
      const res = await assistantFn(input);
      return res.data as { ok: boolean; text: string };
    },
  });
}

export interface AiInvocationRow {
  id: string; feature: string; model: string; actorRole?: string;
  inputTokens?: number | null; outputTokens?: number | null;
  latencyMs?: number; ok: boolean;
}

/** Journal des appels IA (gouvernance — DRH/super_admin). */
export function useAiInvocations() {
  const { orgId, role } = useAuth();
  const canRead = ['super_admin', 'drh'].includes(role ?? '');
  return useQuery<AiInvocationRow[]>({
    queryKey: ['ai', 'invocations', orgId],
    enabled: !!orgId && canRead,
    queryFn: async () => {
      const snap = await getDocs(query(
        collection(db, 'aiInvocations'),
        where('orgId', '==', orgId), orderBy('at', 'desc'), limit(100),
      ));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AiInvocationRow, 'id'>) }));
    },
  });
}
