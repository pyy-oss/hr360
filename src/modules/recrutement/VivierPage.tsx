import { useState } from 'react';
import { ErrBar } from '@/components/mq';
import { useAuth } from '@/auth/AuthProvider';
import { useSeedDemo } from '@/modules/absences/useLeave';
import {
  useCandidates, useAdvanceCandidateStage, type CandidateRow,
} from './useRecrutement';
import { NewCandidateForm } from './NewCandidateForm';
import type { CandidateStage } from '@/types';

const STAGE_LABEL: Record<string, string> = {
  nouveau: 'Nouveau', preselection: 'Présélection', entretien: 'Entretien',
  offre: 'Offre', embauche: 'Embauché', rejete: 'Écarté', vivier: 'Vivier',
};
// Étape suivante « naturelle » dans le pipeline (le recruteur reste maître).
const NEXT_STAGE: Record<string, CandidateStage | undefined> = {
  nouveau: 'preselection', preselection: 'entretien', entretien: 'offre',
  offre: 'embauche', vivier: 'preselection', rejete: 'vivier',
};

function stageChip(stage: string) {
  const on = ['preselection', 'entretien', 'offre', 'embauche'].includes(stage);
  const off = stage === 'rejete';
  return (
    <span className={`chip${on ? ' on' : ''}`} style={off ? { background: 'var(--low-soft)', color: 'var(--low)', border: 'none' } : undefined}>
      {STAGE_LABEL[stage] ?? stage}
    </span>
  );
}
const initials = (c: CandidateRow) => ((c.firstName?.[0] ?? '') + (c.lastName?.[0] ?? '')).toUpperCase() || '—';
const scoreClass = (s?: number) => (s == null ? '' : s >= 80 ? 'sb-high' : s >= 60 ? 'sb-mid' : 'sb-low');

export function VivierPage() {
  const { role } = useAuth();
  const candidates = useCandidates();
  const advance = useAdvanceCandidateStage();
  const seed = useSeedDemo();
  const [showForm, setShowForm] = useState(false);

  const rows = [...(candidates.data ?? [])].sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
  const isSuperAdmin = role === 'super_admin';
  const canManage = ['super_admin', 'drh', 'rh', 'recruteur', 'manager'].includes(role ?? '');
  const empty = !candidates.isLoading && rows.length === 0;

  return (
    <>
      <div className="page-head" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1>Vivier de talents</h1>
          <p>La base de tous les CV déjà reçus. Chaque candidat garde son historique et son score — on ne repart jamais de zéro.</p>
        </div>
        {canManage && !showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14" /></svg>Nouveau candidat
          </button>
        )}
      </div>

      {showForm && <NewCandidateForm onDone={() => setShowForm(false)} />}

      <ErrBar error={candidates.error} prefix="Chargement du vivier impossible." />
      <ErrBar error={advance.error} prefix="Transition impossible." />

      {empty && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
          <div>Aucun candidat dans le vivier.{isSuperAdmin && <> <button className="btn btn-primary" style={{ padding: '4px 10px', marginLeft: 8 }} disabled={seed.isPending} onClick={() => seed.mutate()}>{seed.isPending ? 'Chargement…' : 'Charger des données de démo'}</button></>}</div>
        </div>
      )}

      <div className="card">
        <div className="card-head"><h3>Profils</h3><span className="sub">{rows.length} candidat{rows.length > 1 ? 's' : ''} · triés par score</span></div>
        {candidates.isLoading && <div className="card-pad" style={{ fontSize: 13, color: 'var(--muted)' }}>Chargement…</div>}
        {rows.map((c) => {
          const next = NEXT_STAGE[c.stage];
          return (
            <div key={c.id} className="cand">
              <div className="c-av">{initials(c)}</div>
              <div style={{ width: 190 }}>
                <div className="c-name">{c.firstName} {c.lastName}</div>
                <div className="c-meta">{c.yearsExperience} an{c.yearsExperience > 1 ? 's' : ''} d'exp. · {c.source}</div>
              </div>
              <div className="c-mid" style={{ flex: 1 }}>
                {stageChip(c.stage)}{' '}
                {(c.tags ?? []).slice(0, 3).map((t) => <span key={t} className="chip ref-w" style={{ marginLeft: 4 }}>{t}</span>)}
              </div>
              {c.matchScore != null && <span className={`score-badge ${scoreClass(c.matchScore)}`}>{c.matchScore} %</span>}
              {canManage && next && (
                <button className="btn btn-ghost" style={{ padding: '6px 10px', marginLeft: 8 }} disabled={advance.isPending}
                  onClick={() => advance.mutate({ id: c.id, stage: next })}>
                  → {STAGE_LABEL[next]}
                </button>
              )}
              {canManage && c.stage !== 'rejete' && c.stage !== 'embauche' && (
                <button className="btn btn-ghost" style={{ padding: '6px 10px', marginLeft: 6, color: 'var(--low)' }} disabled={advance.isPending}
                  onClick={() => advance.mutate({ id: c.id, stage: 'rejete' })}>
                  Écarter
                </button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
