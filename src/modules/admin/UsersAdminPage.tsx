import { useState } from 'react';
import { useUsers, useSetUserRole, UserRow } from './useUsers';
import type { Role } from '@/lib/rbac';
import { RequirePermission } from '@/auth/RequirePermission';
import { PageHead, Table, Row, Cell, Button, Input, Select, Notice, Badge } from '@/ui';

const ROLES: Role[] = ['super_admin', 'drh', 'rh', 'manager', 'collaborateur', 'lecture'];

export function UsersAdminPage() {
  const { data: users, isLoading } = useUsers();
  const setRole = useSetUserRole();
  const [notice, setNotice] = useState<string | null>(null);

  async function assign(u: UserRow, role: Role, departmentId: string) {
    await setRole.mutateAsync({ uid: u.id, role, departmentId: departmentId || undefined });
    setNotice(`Rôle « ${role} » attribué à ${u.email ?? u.id}. L'utilisateur doit se reconnecter pour l'activer.`);
  }

  return (
    <RequirePermission resource="settings" action="update"
      fallback={<div className="p-8 text-sm text-muted">Accès réservé à l'administration RH.</div>}>
      <div className="max-w-4xl mx-auto p-8">
        <PageHead title="Administration des utilisateurs"
          subtitle="Rôles et rattachements. Les droits réels sont appliqués côté serveur." />
        {notice && <div className="mb-4"><Notice tone="info">{notice}</Notice></div>}

        {isLoading ? <p className="text-muted text-sm">Chargement…</p> : (
          <Table head={['Utilisateur', 'Rôle actuel', 'Attribuer']}>
            {(users ?? []).map((u) => <UserRowEditor key={u.id} u={u} onAssign={assign} />)}
            {(users ?? []).length === 0 && <Row><Cell className="text-muted">Aucun utilisateur.</Cell></Row>}
          </Table>
        )}
      </div>
    </RequirePermission>
  );
}

function UserRowEditor({ u, onAssign }: { u: UserRow; onAssign: (u: UserRow, r: Role, d: string) => Promise<void> }) {
  const [role, setRole] = useState<Role>(u.role ?? 'collaborateur');
  const [dept, setDept] = useState(u.departmentId ?? '');
  const [busy, setBusy] = useState(false);

  return (
    <Row>
      <Cell>
        <div className="font-medium text-ink">{u.displayName ?? u.email ?? u.id}</div>
        <div className="text-muted-2 text-xs">{u.email}</div>
      </Cell>
      <Cell>{u.role ? <Badge tone="teal">{u.role}</Badge> : '—'}</Cell>
      <Cell>
        <div className="flex items-center gap-2">
          <Select value={role} onChange={(e) => setRole(e.target.value as Role)} className="w-40">
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </Select>
          <Input placeholder="departmentId" value={dept} onChange={(e) => setDept(e.target.value)} className="w-36" />
          <Button disabled={busy}
            onClick={async () => { setBusy(true); try { await onAssign(u, role, dept); } finally { setBusy(false); } }}>
            {busy ? '…' : 'Appliquer'}
          </Button>
        </div>
      </Cell>
    </Row>
  );
}
