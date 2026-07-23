import { useState } from 'react';
import { ErrBar } from '@/components/mq';
import { useAuth } from '@/auth/AuthProvider';
import { useCandidates, usePositions, useAdvanceCandidateStage } from './useRecrutement';
import { useScoreCandidate, type ScoreResult } from '@/modules/ia/useAi';
import { DECISION_STAGES, STAGE_LABEL, initials, scoreClass } from './useRecrutementFO';

function DecisionRow({ candidateId, firstName, lastName, positionTitle, positionId, stage, matchScore, canDecide }: {
  candidateId: string; firstName: string; lastName: string;
  positionTitle?: string; positionId?: string; stage: string; matchScore?: number; canDecide: boolean;
}) {
  const advance = useAdvanceCandidateStage();
  const score = useScoreCandidate();
  const [res, setRes] = useState<ScoreResult | null>(null);

  return (
    <div className="cmp-col">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div className="c-av" style={{ width: 34, height: 34 }}>{initials(firstName, lastName)}</div>
        <div style={{ flex: 1 }}>
          <b style={{ fontSize: '13.5px' }}>{firstName} {lastName}</b>
          <div style={{ fontSize: 11, color: 'var(--muted-2)' }}>{positionTitle ?? 'Sans poste'} · {STAGE_LABEL[stage as keyof typeof STAGE_LABEL] ?? stage}</div>
        </div>
        {matchScore != null && <span className={`score-badge ${scoreClass(matchScore)}`}>{matchScore} %</span>}
      </div>

      {(res ?? score.data) && (() => {
        const r = res ?? score.data!;
        return (
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className={`score-badge ${scoreClass(r.score)}`}>{r.score} %</span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{r.summary}</span>
            </div>
            {r.mustHaveGaps.length > 0
              ? <div style={{ fontSize: 12, color: 'var(--low)' }}>Écarts : {r.mustHaveGaps.join(', ')}</div>
              : <div style={{ fontSize: 12, color: 'var(--muted)' }}>Aucun écart éliminatoire détecté.</div>}
          </div>
        );
      })()}

      <ErrBar error={advance.error} prefix="Décision impossible." />
      <ErrBar error={score.error} prefix="Évaluation indisponible." />

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {positionId && (
          <button className="btn btn-ghost" style={{ padding: '6px 10px' }} disabled={score.isPending}
            onClick={() => score.mutate({ candidateId, positionId }, { onSuccess: (r) => setRes(r) })}>
            {score.isPending ? 'Analyse…' : 'Évaluer les écarts'}
          </button>
        )}
        {canDecide && (
          <>
            <button className="btn btn-primary" style={{ padding: '6px 10px' }} disabled={advance.isPending}
              onClick={() => advance.mutate({ id: candidateId, stage: 'embauche' })}>
              Recruter
            </button>
            <button className="btn btn-ghost" style={{ padding: '6px 10px', color: 'var(--low)' }} disabled={advance.isPending}
              onClick={() => advance.mutate({ id: candidateId, stage: 'rejete' })}>
              Refuser
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function DecisionPage() {
  const { role } = useAuth();
  const candidates = useCandidates();
  const positions = usePositions();
  const canDecide = ['super_admin', 'drh', 'rh'].includes(role ?? '');

  const finalists = (candidates.data ?? [])
    .filter((c) => DECISION_STAGES.includes(c.stage))
    .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
  const empty = !candidates.isLoading && finalists.length === 0;

  return (
    <>
      <div className="page-head">
        <h1>Décision &amp; jury</h1>
        <p>Les candidats en fin de pipeline (entretien, offre). Évaluez les écarts, puis prononcez la décision : recruté ou refusé. Chaque transition est auditée côté serveur.</p>
      </div>

      <ErrBar error={candidates.error} prefix="Chargement des finalistes impossible." />

      {empty && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
          <div>Aucun candidat en phase de décision. Faites progresser des profils depuis le vivier ou la boîte RH.</div>
        </div>
      )}

      {candidates.isLoading && <div className="card"><div className="card-pad" style={{ fontSize: 13, color: 'var(--muted)' }}>Chargement…</div></div>}

      {finalists.length > 0 && (
        <>
          <div className="section-t" style={{ marginTop: 0 }}>Finalistes · {finalists.length}</div>
          <div className="grid g3">
            {finalists.map((c) => {
              const pos = (positions.data ?? []).find((p) => p.id === c.positionId);
              return (
                <DecisionRow key={c.id} candidateId={c.id} firstName={c.firstName} lastName={c.lastName}
                  positionTitle={pos?.title} positionId={c.positionId} stage={c.stage}
                  matchScore={c.matchScore} canDecide={canDecide} />
              );
            })}
          </div>
          {!canDecide && (
            <div className="note" style={{ marginTop: 16 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
              La décision finale (recruter / refuser) est réservée aux équipes RH et DRH.
            </div>
          )}
        </>
      )}
    </>
  );
}
