import { useState } from 'react';
import { ErrBar, Field } from '@/components/mq';
import { useAuth } from '@/auth/AuthProvider';
import { useSeedDemo } from '@/modules/absences/useLeave';
import {
  useCandidates, usePositions, useUpsertCandidate, useAdvanceCandidateStage,
  type CandidateRow,
} from './useRecrutement';
import { STAGE_LABEL, NEXT_STAGE, initials, scoreClass } from './useRecrutementFO';
import type { CandidateInput } from '@/types';

const SOURCE_LABEL: Record<string, string> = {
  spontanee: 'Spontanée', site: 'Site carrières', cooptation: 'Cooptation',
  linkedin: 'LinkedIn', cabinet: 'Cabinet', autre: 'Autre',
};

function stageChip(stage: string) {
  const on = ['preselection', 'entretien', 'offre', 'embauche'].includes(stage);
  const off = stage === 'rejete';
  return (
    <span className={`chip${on ? ' on' : ''}`} style={off ? { background: 'var(--low-soft)', color: 'var(--low)', border: 'none' } : undefined}>
      {STAGE_LABEL[stage as keyof typeof STAGE_LABEL] ?? stage}
    </span>
  );
}

export function BoiteRhPage() {
  const { role } = useAuth();
  const candidates = useCandidates();
  const positions = usePositions();
  const upsert = useUpsertCandidate();
  const advance = useAdvanceCandidateStage();
  const seed = useSeedDemo();
  const [attachTo, setAttachTo] = useState<Record<string, string>>({});

  const canManage = ['super_admin', 'drh', 'rh', 'recruteur', 'manager'].includes(role ?? '');
  const isSuperAdmin = role === 'super_admin';

  const all = candidates.data ?? [];
  const active = all.filter((c) => c.stage !== 'rejete' && c.stage !== 'embauche');
  // File de traitement : d'abord les candidatures à rattacher (sans poste),
  // puis les plus « fraîches » (étape la plus amont d'abord).
  const stageRank: Record<string, number> = { nouveau: 0, preselection: 1, vivier: 1, entretien: 2, offre: 3 };
  const queue = [...active].sort((a, b) => {
    const pa = a.positionId ? 1 : 0;
    const pb = b.positionId ? 1 : 0;
    if (pa !== pb) return pa - pb;
    return (stageRank[a.stage] ?? 9) - (stageRank[b.stage] ?? 9);
  });

  const received = active.length;
  const toAttach = active.filter((c) => !c.positionId).length;
  const scored = active.filter((c) => c.matchScore != null).length;
  const empty = !candidates.isLoading && all.length === 0;

  const attach = (c: CandidateRow, positionId: string) => {
    const pos = (positions.data ?? []).find((p) => p.id === positionId);
    const input: CandidateInput = {
      id: c.id,
      firstName: c.firstName, lastName: c.lastName, email: c.email,
      phone: c.phone,
      source: c.source as CandidateInput['source'],
      positionId,
      departmentId: pos?.departmentId ?? c.departmentId,
      yearsExperience: c.yearsExperience,
      stage: c.stage,
      matchScore: c.matchScore,
      tags: c.tags ?? [],
    };
    upsert.mutate(input);
  };

  return (
    <>
      <div className="page-head">
        <h1>Boîte RH</h1>
        <p>File de traitement des candidatures reçues. Rattachez les candidatures spontanées à une ouverture de poste, puis faites-les avancer dans le pipeline.</p>
      </div>

      <ErrBar error={candidates.error} prefix="Chargement des candidatures impossible." />
      <ErrBar error={upsert.error} prefix="Rattachement impossible." />
      <ErrBar error={advance.error} prefix="Transition impossible." />

      <div className="grid g3" style={{ marginBottom: 16 }}>
        <div className="card kpi"><div className="k-val display">{received}</div><div className="k-lab">Candidatures en cours</div></div>
        <div className="card kpi"><div className="k-val display">{toAttach}</div><div className="k-lab">À rattacher à un poste</div></div>
        <div className="card kpi"><div className="k-val display">{scored}</div><div className="k-lab">Déjà scorées</div></div>
      </div>

      {empty && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
          <div>Aucune candidature reçue.{isSuperAdmin && <> <button className="btn btn-primary" style={{ padding: '4px 10px', marginLeft: 8 }} disabled={seed.isPending} onClick={() => seed.mutate()}>{seed.isPending ? 'Chargement…' : 'Charger des données de démo'}</button></>}</div>
        </div>
      )}

      <div className="card">
        <div className="card-head">
          <h3>File de traitement</h3>
          <span className="sub">{queue.length} candidature{queue.length > 1 ? 's' : ''} en attente de traitement</span>
        </div>
        {candidates.isLoading && <div className="card-pad" style={{ fontSize: 13, color: 'var(--muted)' }}>Chargement…</div>}
        {!candidates.isLoading && queue.length === 0 && !empty && (
          <div className="card-pad" style={{ fontSize: 13, color: 'var(--muted)' }}>Aucune candidature en attente — tout est traité.</div>
        )}
        {queue.map((c) => {
          const pos = (positions.data ?? []).find((p) => p.id === c.positionId);
          const next = NEXT_STAGE[c.stage];
          const sel = attachTo[c.id] ?? '';
          return (
            <div key={c.id} className="cand">
              <div className="c-av">{initials(c.firstName, c.lastName)}</div>
              <div style={{ width: 190 }}>
                <div className="c-name">{c.firstName} {c.lastName}</div>
                <div className="c-meta">{c.yearsExperience} an{c.yearsExperience > 1 ? 's' : ''} d'exp. · {SOURCE_LABEL[c.source] ?? c.source}</div>
              </div>
              <div className="c-mid" style={{ flex: 1 }}>
                {stageChip(c.stage)}{' '}
                {pos
                  ? <span className="chip on" style={{ marginLeft: 4 }}>{pos.title}</span>
                  : <span className="chip" style={{ marginLeft: 4, background: 'var(--mid-soft)', color: 'var(--mid)', border: 'none' }}>À rattacher</span>}
              </div>
              {c.matchScore != null && <span className={`score-badge ${scoreClass(c.matchScore)}`}>{c.matchScore} %</span>}
              {canManage && !c.positionId && (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: 8 }}>
                  <Field label="Rattacher à" style={{ minWidth: 170 }}>
                    <select className="field" value={sel} onChange={(e) => setAttachTo((s) => ({ ...s, [c.id]: e.target.value }))}>
                      <option value="">— poste —</option>
                      {(positions.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                  </Field>
                  <button className="btn btn-primary" style={{ padding: '6px 10px' }} disabled={!sel || upsert.isPending}
                    onClick={() => attach(c, sel)}>
                    Rattacher
                  </button>
                </div>
              )}
              {canManage && next && (
                <button className="btn btn-ghost" style={{ padding: '6px 10px', marginLeft: 8 }} disabled={advance.isPending}
                  onClick={() => advance.mutate({ id: c.id, stage: next })}>
                  → {STAGE_LABEL[next]}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
