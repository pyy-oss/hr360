import { useEmployeeAssignments } from './useStaffing';
import { Bar } from '@/ui';

export function WorkloadBar({ employeeId }: { employeeId: string }) {
  const { data: assignments, isLoading } = useEmployeeAssignments(employeeId);
  if (isLoading) return <p className="text-sm text-muted-2">Chargement du plan de charge…</p>;

  const total = (assignments ?? []).reduce((s, a) => s + (a.allocationPct ?? 0), 0);
  const tone = total > 100 ? 'danger' : total >= 85 ? 'warn' : 'teal';

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted">Plan de charge</span>
        <span className="font-medium text-ink">{total}%</span>
      </div>
      <Bar value={total} tone={tone} />
      <ul className="mt-3 space-y-1 text-sm">
        {(assignments ?? []).map((a) => (
          <li key={a.id} className="flex justify-between">
            <span className="text-muted">{a.missionId}</span>
            <span className="font-mono text-xs">{a.allocationPct}% · {a.startDate} → {a.endDate}</span>
          </li>
        ))}
        {(assignments ?? []).length === 0 && <li className="text-muted-2">Aucune affectation en cours.</li>}
      </ul>
    </div>
  );
}
