import { useState } from 'react';
import { Field, ErrBar } from '@/components/mq';
import { useAuth } from '@/auth/AuthProvider';
import { useDirectory } from '@/modules/collaborateurs/useCollaborateurs';
import { DOCUMENT_CATEGORY_LABEL, DocumentCategory } from '@/types';
import type { z } from 'zod';
import {
  useMyDocuments, useEmployeeDocuments, useUploadDocument, useDeleteDocument,
  getUrl, type DocumentRow,
} from './useDocuments';
import { useBulkIngest, useRecentIngestionJobs, type IngestionJobRow } from '@/modules/ingestion/useIngestion';

type Category = z.infer<typeof DocumentCategory>;
const CATEGORIES = DocumentCategory.options;

/** Libellé + couleurs (tokens maquette) associés au statut d'un job d'import. */
const JOB_STATUS: Record<IngestionJobRow['status'], { label: string; bg: string; fg: string }> = {
  pending: { label: 'planifié', bg: 'var(--mid-soft)', fg: 'var(--mid)' },
  processing: { label: 'en cours', bg: 'var(--signal-soft)', fg: 'var(--signal-deep)' },
  done: { label: 'terminé', bg: 'var(--high-soft)', fg: 'var(--high)' },
  error: { label: 'erreur', bg: 'var(--low-soft)', fg: 'var(--low)' },
};

/** Formate le Timestamp Firestore en date lisible (fr-FR), tolérant à l'absence. */
function fmtDate(row: DocumentRow): string {
  const ts = row.createdAt;
  if (!ts) return '—';
  try {
    return ts.toDate().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return '—';
  }
}

/** Ligne d'un document : nom, catégorie (badge), date + actions. */
function DocRow({ doc, onDelete, deleting }: {
  doc: DocumentRow;
  onDelete?: (doc: DocumentRow) => void;
  deleting?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const download = async () => {
    setBusy(true);
    try {
      const url = await getUrl(doc.storagePath);
      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="cand">
      <div style={{ flex: 1 }}>
        <div className="c-name" style={{ fontSize: 13 }}>{doc.name}</div>
        <div className="c-meta">déposé le {fmtDate(doc)}</div>
      </div>
      <span className="chip" style={{ background: 'var(--signal-soft)', color: 'var(--signal-deep)', border: 'none' }}>
        {DOCUMENT_CATEGORY_LABEL[doc.category] ?? doc.category}
      </span>
      <button className="btn btn-ghost" disabled={busy} onClick={download} style={{ padding: '4px 10px' }}>
        {busy ? '…' : 'Télécharger'}
      </button>
      {onDelete && (
        <button className="btn btn-ghost" disabled={deleting} onClick={() => onDelete(doc)} style={{ padding: '4px 10px' }}>
          Supprimer
        </button>
      )}
    </div>
  );
}

/** État vide / chargement partagé pour une liste de documents. */
function DocList({ docs, loading, onDelete, deleting, emptyLabel }: {
  docs: DocumentRow[];
  loading: boolean;
  onDelete?: (doc: DocumentRow) => void;
  deleting?: boolean;
  emptyLabel: string;
}) {
  if (loading) return <p className="c-meta" style={{ padding: '4px 0' }}>Chargement…</p>;
  if (docs.length === 0) return <p className="c-meta" style={{ padding: '4px 0' }}>{emptyLabel}</p>;
  return <>{docs.map((d) => <DocRow key={d.id} doc={d} onDelete={onDelete} deleting={deleting} />)}</>;
}

/** Formulaire de dépôt réservé à la RH — upload Storage + enregistrement métadonnée. */
function UploadForm({ employeeId }: { employeeId: string }) {
  const upload = useUploadDocument();
  const [category, setCategory] = useState<Category>('bulletin');
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const submit = () => {
    setErr(null);
    if (!file) { setErr('Sélectionnez un fichier.'); return; }
    const finalName = name.trim() || file.name;
    upload.mutate(
      { employeeId, category, name: finalName, file },
      {
        onSuccess: () => { setName(''); setFile(null); },
        onError: (e) => setErr((e as Error).message || 'Échec du dépôt.'),
      },
    );
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-head"><h3>Déposer un document</h3><span className="sub">journalisé (audit ARTCI)</span></div>
      <div className="card-pad">
        <div className="form-grid">
          <Field label="Catégorie">
            <select className="field" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{DOCUMENT_CATEGORY_LABEL[c] ?? c}</option>)}
            </select>
          </Field>
          <Field label="Nom du document" hint="Laisser vide pour reprendre le nom du fichier.">
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Bulletin de paie — juin 2026" />
          </Field>
          <Field label="Fichier (PDF ou image, < 15 Mo)" style={{ gridColumn: '1 / -1' }}>
            <input
              className="field"
              type="file"
              accept="application/pdf,image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </Field>
        </div>
        {upload.isPending && (
          <div className="note" style={{ marginTop: 8 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 21h14" /></svg>
            Dépôt en cours… envoi du fichier puis enregistrement.
          </div>
        )}
        {err && <div className="ferr" role="alert">{err}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="btn btn-primary" disabled={upload.isPending || !file} onClick={submit}>
            {upload.isPending ? 'Dépôt…' : 'Déposer'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Ligne d'un job d'import récent : statut, avancement, ignorés, erreurs. */
function JobRow({ job }: { job: IngestionJobRow }) {
  const st = JOB_STATUS[job.status];
  return (
    <div className="cand">
      <div style={{ flex: 1 }}>
        <div className="c-name" style={{ fontSize: 13 }}>
          {job.processed}/{job.total} traité{job.total > 1 ? 's' : ''}
          {job.skipped > 0 ? ` · ${job.skipped} ignoré${job.skipped > 1 ? 's' : ''}` : ''}
        </div>
        {job.errors.length > 0 && (
          <div className="c-meta" style={{ color: 'var(--low)' }}>
            {job.errors.length} erreur{job.errors.length > 1 ? 's' : ''} : {job.errors.slice(0, 2).join(' · ')}
            {job.errors.length > 2 ? '…' : ''}
          </div>
        )}
      </div>
      <span className="chip" style={{ background: st.bg, color: st.fg, border: 'none' }}>
        {st.label}
      </span>
    </div>
  );
}

/** Import en masse réservé RH : ouvre un job serveur par fichier (ZIP décompressé côté serveur). */
function BulkImportForm({ employeeId }: { employeeId: string }) {
  const bulk = useBulkIngest();
  const jobs = useRecentIngestionJobs('documents');
  const [category, setCategory] = useState<Category>('bulletin');
  const [files, setFiles] = useState<File[]>([]);
  const [key, setKey] = useState(0);

  const submit = () => {
    if (!employeeId || files.length === 0) return;
    bulk.mutate(
      { type: 'documents', employeeId, category, files },
      { onSuccess: () => { setFiles([]); setKey((k) => k + 1); } },
    );
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-head"><h3>Import en masse</h3><span className="sub">ZIP · PDF · Word</span></div>
      <div className="card-pad">
        <ErrBar error={bulk.error} prefix="Import en masse impossible." />
        <ErrBar error={jobs.error} prefix="Chargement des imports récents impossible." />

        <div className="form-grid">
          <Field label="Catégorie appliquée au lot">
            <select className="field" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{DOCUMENT_CATEGORY_LABEL[c] ?? c}</option>)}
            </select>
          </Field>
          <Field label="Fichiers à importer" style={{ gridColumn: '1 / -1' }}>
            <input
              key={key}
              className="field"
              type="file"
              multiple
              accept=".zip,.pdf,.doc,.docx,application/pdf,application/zip"
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            />
          </Field>
        </div>

        <div className="note" style={{ marginTop: 8 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
          Une archive ZIP est décompressée côté serveur ; PDF et Word acceptés.
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
          <button
            className="btn btn-primary"
            disabled={bulk.isPending || !employeeId || files.length === 0}
            onClick={submit}
          >
            {bulk.isPending ? 'Import…' : `Importer${files.length > 0 ? ` (${files.length})` : ''}`}
          </button>
          {files.length === 0 && <span className="c-meta">Sélectionnez au moins un fichier.</span>}
        </div>

        <div style={{ fontSize: 13, fontWeight: 600, margin: '14px 0 6px' }}>Imports récents</div>
        {jobs.isLoading && <p className="c-meta" style={{ padding: '4px 0' }}>Chargement…</p>}
        {!jobs.isLoading && (jobs.data ?? []).length === 0 && (
          <p className="c-meta" style={{ padding: '4px 0' }}>Aucun import récent.</p>
        )}
        {(jobs.data ?? []).map((j) => <JobRow key={j.id} job={j} />)}
      </div>
    </div>
  );
}

/** Bloc RH : sélection d'un collaborateur, dépôt, et gestion de ses documents. */
function ManagementSection() {
  const dir = useDirectory();
  const [selId, setSelId] = useState('');
  const docs = useEmployeeDocuments(selId || undefined);
  const del = useDeleteDocument();
  const sel = (dir.data ?? []).find((e) => e.id === selId);

  const onDelete = (doc: DocumentRow) => {
    if (confirm(`Supprimer définitivement « ${doc.name} » ? Le fichier et sa métadonnée seront effacés.`)) {
      del.mutate(doc.id);
    }
  };

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="card-head">
        <h3>Gestion des documents</h3>
        <span className="sub">RH / DRH</span>
      </div>
      <div className="card-pad">
        <ErrBar error={dir.error} prefix="Chargement de l'annuaire impossible." />
        <ErrBar error={docs.error} prefix="Chargement des documents impossible." />
        <ErrBar error={del.error} prefix="Suppression impossible." />

        <div className="form-grid" style={{ marginBottom: 8 }}>
          <Field label="Collaborateur">
            <select className="field" value={selId} onChange={(e) => setSelId(e.target.value)}>
              <option value="">— choisir —</option>
              {(dir.data ?? []).map((e) => (
                <option key={e.id} value={e.id}>{e.lastName} {e.firstName}{e.jobTitle ? ` · ${e.jobTitle}` : ''}</option>
              ))}
            </select>
          </Field>
        </div>

        {!selId && <p className="c-meta">Sélectionnez un collaborateur pour déposer et gérer ses documents.</p>}

        {selId && (
          <>
            <UploadForm employeeId={selId} />
            <BulkImportForm employeeId={selId} />
            <div style={{ fontSize: 13, fontWeight: 600, margin: '4px 0 6px' }}>
              Documents de {sel ? `${sel.firstName} ${sel.lastName}` : 'ce collaborateur'}
            </div>
            <DocList
              docs={docs.data ?? []}
              loading={docs.isLoading}
              onDelete={onDelete}
              deleting={del.isPending}
              emptyLabel="Aucun document pour ce collaborateur."
            />
          </>
        )}
      </div>
    </div>
  );
}

export function DocumentsPage() {
  const { role, employeeId } = useAuth();
  const isStaff = ['super_admin', 'drh', 'rh'].includes(role ?? '');
  const mine = useMyDocuments();

  return (
    <>
      <div className="page-head">
        <h1>Coffre-fort documentaire</h1>
        <p>Bulletins, attestations et contrats — vos documents RH, accessibles et sécurisés.</p>
        <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>données personnelles · accès tracé</span>
      </div>

      {employeeId && (
        <div className="card">
          <div className="card-head"><h3>Mes documents</h3><span className="sub">{mine.data?.length ?? 0}</span></div>
          <div className="card-pad">
            <ErrBar error={mine.error} prefix="Chargement de vos documents impossible." />
            <DocList
              docs={mine.data ?? []}
              loading={mine.isLoading}
              emptyLabel="Aucun document disponible pour le moment."
            />
          </div>
        </div>
      )}

      {!employeeId && !isStaff && (
        <div className="alert alert-info">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
          <div>Votre compte n'est pas encore rattaché à un dossier collaborateur. Contactez la RH.</div>
        </div>
      )}

      {isStaff && <ManagementSection />}

      <div className="note" style={{ marginTop: 16 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
        Données personnelles (conformité ARTCI) : accès limité au collaborateur et à la RH, chaque dépôt et suppression est journalisé.
      </div>
    </>
  );
}
