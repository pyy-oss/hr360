import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ErrBar, Field } from '@/components/mq';
import { useAuth } from '@/auth/AuthProvider';
import { useSeedDemo } from '@/modules/absences/useLeave';
import { useBulkIngest, useRecentIngestionJobs, type IngestionJobRow } from '@/modules/ingestion/useIngestion';
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

const JOB_STATUS_LABEL: Record<IngestionJobRow['status'], string> = {
  pending: 'En attente', processing: 'Traitement…', done: 'Terminé', error: 'Erreur',
};

function jobStatusChip(status: IngestionJobRow['status']) {
  if (status === 'done') return <span className="chip on">{JOB_STATUS_LABEL[status]}</span>;
  if (status === 'error') return <span className="chip" style={{ background: 'var(--low-soft)', color: 'var(--low)', border: 'none' }}>{JOB_STATUS_LABEL[status]}</span>;
  return <span className="chip" style={{ background: 'var(--mid-soft)', color: 'var(--mid)', border: 'none' }}>{JOB_STATUS_LABEL[status]}</span>;
}

export function BoiteRhPage() {
  const { role } = useAuth();
  const candidates = useCandidates();
  const positions = usePositions();
  const upsert = useUpsertCandidate();
  const advance = useAdvanceCandidateStage();
  const seed = useSeedDemo();
  const qc = useQueryClient();
  const bulkIngest = useBulkIngest();
  const ingestJobs = useRecentIngestionJobs('candidates');
  const [attachTo, setAttachTo] = useState<Record<string, string>>({});
  const [importPositionId, setImportPositionId] = useState('');
  const [importFiles, setImportFiles] = useState<File[]>([]);
  const [fileInputKey, setFileInputKey] = useState(0);

  const canManage = ['super_admin', 'drh', 'rh', 'recruteur', 'manager'].includes(role ?? '');
  const canImport = ['super_admin', 'drh', 'rh', 'recruteur'].includes(role ?? '');
  const isSuperAdmin = role === 'super_admin';

  const runImport = () => {
    if (importFiles.length === 0) return;
    bulkIngest.mutate(
      { type: 'candidates', positionId: importPositionId || undefined, files: importFiles },
      {
        onSuccess: () => {
          setImportFiles([]);
          setFileInputKey((k) => k + 1);
          qc.invalidateQueries({ queryKey: ['candidates'] });
        },
      },
    );
  };

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
      {canImport && <ErrBar error={bulkIngest.error} prefix="Import des CV impossible." />}
      {canImport && <ErrBar error={ingestJobs.error} prefix="Chargement des imports récents impossible." />}

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

      {canImport && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-head">
            <h3>Import de CV en masse</h3>
            <span className="sub">Téléversez plusieurs CV d'un coup — chacun crée un candidat à qualifier</span>
          </div>
          <div className="card-pad">
            <p className="note" style={{ marginTop: 0 }}>
              Une archive ZIP est décompressée côté serveur ; chaque PDF/Word devient un candidat à qualifier (nom à compléter).
            </p>
            <div className="form-grid" style={{ marginBottom: 12 }}>
              <Field label="Rattacher les candidats à un poste (facultatif)">
                <select className="field" value={importPositionId} onChange={(e) => setImportPositionId(e.target.value)}>
                  <option value="">— non rattaché —</option>
                  {(positions.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </Field>
              <Field label="Fichiers (ZIP, PDF ou Word)">
                <input
                  key={fileInputKey}
                  className="field"
                  type="file"
                  multiple
                  accept=".zip,.pdf,.doc,.docx,application/pdf,application/zip"
                  onChange={(e) => setImportFiles(e.target.files ? Array.from(e.target.files) : [])}
                />
              </Field>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                className="btn btn-primary"
                disabled={importFiles.length === 0 || bulkIngest.isPending}
                onClick={runImport}
              >
                {bulkIngest.isPending ? 'Import en cours…' : 'Importer les CV'}
              </button>
              {importFiles.length > 0 && (
                <span className="sub">{importFiles.length} fichier{importFiles.length > 1 ? 's' : ''} sélectionné{importFiles.length > 1 ? 's' : ''}</span>
              )}
            </div>
            <p className="note" style={{ marginBottom: 0, marginTop: 12 }}>
              Les candidats importés sont enregistrés en brouillon « à qualifier » (nom et poste à compléter),
              conformément à l'ARTCI : minimisation des données et révision humaine avant exploitation.
            </p>
          </div>

          <div className="card-head" style={{ borderTop: '1px solid var(--line)' }}>
            <h3>Imports récents</h3>
            <span className="sub">Mis à jour automatiquement pendant le traitement</span>
          </div>
          {ingestJobs.isLoading && (
            <div className="card-pad" style={{ fontSize: 13, color: 'var(--muted)' }}>Chargement…</div>
          )}
          {!ingestJobs.isLoading && (ingestJobs.data ?? []).length === 0 && (
            <div className="card-pad" style={{ fontSize: 13, color: 'var(--muted)' }}>Aucun import pour le moment.</div>
          )}
          {(ingestJobs.data ?? []).map((job) => {
            const pos = job.positionId ? (positions.data ?? []).find((p) => p.id === job.positionId) : undefined;
            return (
              <div key={job.id} className="cand">
                <div className="c-mid" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {jobStatusChip(job.status)}
                  <span className="c-name">{job.processed}/{job.total} traité{job.total > 1 ? 's' : ''}</span>
                  {job.skipped > 0 && <span className="sub">· {job.skipped} ignoré{job.skipped > 1 ? 's' : ''}</span>}
                  <span className="sub">· {pos ? pos.title : 'Non rattaché'}</span>
                </div>
                {job.errors.length > 0 && (
                  <span className="chip" style={{ background: 'var(--low-soft)', color: 'var(--low)', border: 'none' }}>
                    {job.errors.length} erreur{job.errors.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            );
          })}
          {(ingestJobs.data ?? []).some((j) => j.errors.length > 0) && (
            <div className="card-pad" style={{ paddingTop: 0 }}>
              {(ingestJobs.data ?? []).filter((j) => j.errors.length > 0).map((j) => (
                <p key={j.id} className="note" style={{ margin: '4px 0', color: 'var(--low)' }}>
                  {j.errors.join(' · ')}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
