import { useMemo, useState } from 'react';
import { ErrBar, Field } from '@/components/mq';
import { useAuth } from '@/auth/AuthProvider';
import { useCandidates, usePositions } from './useRecrutement';
import { useScoreCandidate } from '@/modules/ia/useAi';
import { STAGE_LABEL, initials, scoreClass } from './useRecrutementFO';

const SOURCE_LABEL: Record<string, string> = {
  spontanee: 'Candidature spontanée', site: 'Site carrières', cooptation: 'Cooptation',
  linkedin: 'LinkedIn', cabinet: 'Cabinet', autre: 'Autre',
};

export function ProfilPage() {
  const { role } = useAuth();
  const candidates = useCandidates();
  const positions = usePositions();
  const score = useScoreCandidate();
  const [candidateId, setCandidateId] = useState('');
  const [scorePositionId, setScorePositionId] = useState('');

  const canView = ['super_admin', 'drh', 'rh', 'manager'].includes(role ?? '');

  const cand = useMemo(
    () => (candidates.data ?? []).find((c) => c.id === candidateId),
    [candidates.data, candidateId],
  );
  const attachedPosition = useMemo(
    () => (positions.data ?? []).find((p) => p.id === cand?.positionId),
    [positions.data, cand],
  );

  // Poste utilisé pour l'évaluation : le poste rattaché, sinon un choix manuel.
  const effectivePositionId = cand?.positionId ?? scorePositionId;
  const result = score.data;

  if (!canView) {
    return (
      <>
        <div className="page-head"><h1>Profil 360°</h1></div>
        <div className="alert alert-info">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
          <div>Cet écran est réservé aux équipes RH, DRH et managers.</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-head">
        <h1>Profil 360°</h1>
        <p>Fiche détaillée d'un candidat du vivier. Sélectionnez un profil pour consulter son parcours et évaluer son adéquation à un poste.</p>
      </div>

      <ErrBar error={candidates.error} prefix="Chargement des candidats impossible." />

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-pad">
          <Field label="Candidat">
            <select className="field" value={candidateId} onChange={(e) => { setCandidateId(e.target.value); setScorePositionId(''); score.reset(); }}>
              <option value="">— choisir un candidat —</option>
              {(candidates.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName} · {STAGE_LABEL[c.stage]}</option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {cand && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-head">
              <h3>{cand.firstName} {cand.lastName}</h3>
              <span className="sub">{STAGE_LABEL[cand.stage]}{cand.matchScore != null && <> · <span className={`score-badge ${scoreClass(cand.matchScore)}`}>{cand.matchScore} %</span></>}</span>
            </div>
            <div className="card-pad">
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div className="c-av" style={{ width: 54, height: 54, fontSize: 18 }}>{initials(cand.firstName, cand.lastName)}</div>
                <div style={{ flex: 1 }}>
                  <div className="ref-row"><span>Expérience</span><span className="ref-w">{cand.yearsExperience} an{cand.yearsExperience > 1 ? 's' : ''}</span></div>
                  <div className="ref-row"><span>Source</span><span className="ref-w">{SOURCE_LABEL[cand.source] ?? cand.source}</span></div>
                  <div className="ref-row"><span>Email</span><span className="ref-w" style={{ fontFamily: 'Inter', fontWeight: 500 }}>{cand.email}</span></div>
                  {cand.phone && <div className="ref-row"><span>Téléphone</span><span className="ref-w" style={{ fontFamily: 'Inter', fontWeight: 500 }}>{cand.phone}</span></div>}
                  <div className="ref-row"><span>Poste rattaché</span><span className="ref-w">{attachedPosition ? attachedPosition.title : 'Vivier (aucun poste)'}</span></div>
                  <div className="ref-row" style={{ border: 'none' }}>
                    <span>Compétences déclarées</span>
                    <span>{(cand.tags ?? []).length > 0 ? (cand.tags ?? []).map((t) => <span key={t} className="chip ref-w" style={{ marginLeft: 4 }}>{t}</span>) : <span className="ref-w">—</span>}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Évaluation de l'adéquation</h3><span className="feat">Claude · aide à la décision</span></div>
            <div className="card-pad">
              {!cand.positionId && (
                <Field label="Poste pour l'évaluation" style={{ marginBottom: 10 }}>
                  <select className="field" value={scorePositionId} onChange={(e) => setScorePositionId(e.target.value)}>
                    <option value="">— choisir un poste —</option>
                    {(positions.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </Field>
              )}
              {cand.positionId && attachedPosition && (
                <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 10 }}>Évaluation face au poste rattaché : <b>{attachedPosition.title}</b>.</div>
              )}

              <ErrBar error={score.error} prefix="Évaluation indisponible." />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button className="btn btn-primary" disabled={!effectivePositionId || score.isPending}
                  onClick={() => score.mutate({ candidateId: cand.id, positionId: effectivePositionId! })}>
                  {score.isPending ? 'Analyse…' : "Évaluer l'adéquation"}
                </button>
                <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>Score professionnel uniquement — identité jamais transmise (ARTCI).</span>
              </div>

              {result && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <span className={`score-badge ${scoreClass(result.score)}`} style={{ fontSize: 18 }}>{result.score} %</span>
                    <span style={{ fontSize: 13 }}>{result.summary}</span>
                  </div>
                  {result.axes.map((a) => (
                    <div key={a.axis} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><b>{a.axis}</b><span className="mono">{a.score}</span></div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{a.rationale}</div>
                    </div>
                  ))}
                  {result.mustHaveGaps.length > 0 && (
                    <div className="alert alert-warn" style={{ fontSize: 12, marginTop: 8 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>
                      <div>Écarts sur compétences éliminatoires : {result.mustHaveGaps.join(', ')}</div>
                    </div>
                  )}
                  <div className="note" style={{ marginTop: 10 }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>Aide à la décision : la sélection reste un choix humain. Analyse journalisée (gouvernance).</div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
