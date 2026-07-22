import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { Role } from '@/lib/rbac';

interface AuthState {
  user: User | null;
  role?: Role;
  orgId?: string;
  departmentId?: string;
  employeeId?: string;
  loading: boolean;
}

const Ctx = createContext<AuthState>({ user: null, loading: true });
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) return setState({ user: null, loading: false });
      // Les claims (rôle, rattachement) font autorité — lus depuis le token.
      const token = await user.getIdTokenResult();
      const c = token.claims as Record<string, string>;
      setState({
        user, loading: false,
        role: c.role as Role, orgId: c.orgId,
        departmentId: c.departmentId, employeeId: c.employeeId,
      });
    });
  }, []);

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}
