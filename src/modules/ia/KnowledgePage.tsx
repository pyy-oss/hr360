import { useState } from 'react';
import { ErrBar, Field } from '@/components/mq';
import { useAuth } from '@/auth/AuthProvider';
import { useSeedDemo } from '@/modules/absences/useLeave';
import { useAskKnowledge, useKnowledgeDocs, useUpsertKnowledgeDoc } from './useAi';

const CAT_LABEL: Record<string, string> = {
  reglement: 'Règlement', convention: 'Convention', procedure: 'Procédure',
  note_rh: 'Note RH', faq: 'FAQ', autre: 'Autre',
};

function NewDocForm({ onDone }: { onDone: () => void }) {
  const upsert = useUpsertKnowledgeDoc();
  const [f, setF] = useState({ title: '', category: 'procedure', content: '' });
  const [err, setErr] = useState<string | null>(null);
  const submit = () => {
    setErr(null);
    if (!f.title.trim() || !f.content.trim()) { setErr('Titre et contenu requis.'); return; }
    upsert.mutate({ title: f.title, category: f.category as never, content: f.content }, {
      onSuccess: () => onDone(),
      onError: (e) => setErr((e as Error).message || 'Échec.'),
    });
  };
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-head"><h3>Nouveau document</h3></div>
      <div className="card-pad">
        <div className="form-grid">
          <Field label="Titre"><input className="field" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Procédure de validation des congés" /></Field>
          <Field label="Catégorie">
            <select className="field" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
              {Object.entries(CAT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Contenu (texte de référence — sera cité)" style={{ gridColumn: '1 / -1' }}>
            <textarea className="field" rows={6} value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} placeholder="Colle ici le texte du règlement, de la procédure, de la note RH…" />
          </Field>
        </div>
        {err && <div className="ferr" role="alert">{err}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="btn btn-primary" disabled={upsert.isPending} onClick={submit}>{upsert.isPending ? 'Enregistrement…' : 'Ajouter à la base'}</button>
          <button className="btn btn-ghost" onClick={onDone}>Annuler</button>
        </div>
      </div>
    </div>
  );
}

export function KnowledgePage() {
  const { role } = useAuth();
  const ask = useAskKnowledge();
  const docs = useKnowledgeDocs();
  const seed = useSeedDemo();
  const [q, setQ] = useState('');
  const [showForm, setShowForm] = useState(false);
  const canManage = ['super_admin', 'drh', 'rh'].includes(role ?? '');
  const isSuperAdmin = role === 'super_admin';
  const rows = docs.data ?? [];
  const answer = ask.data;

  const send = () => { if (q.trim() && !ask.isPending) ask.mutate(q.trim()); };

  return (
    <>
      <div className="page-head" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1>Base de connaissances RH</h1>
          <p>Un assistant qui répond aux questions de politique RH en s'appuyant sur vos documents internes — avec les sources <b>citées</b>.</p>
          <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>Couche IA · RAG cité (Claude)</span>
        </div>
        {canManage && !showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>Document
          </button>
        )}
      </div>

      {showForm && <NewDocForm onDone={() => setShowForm(false)} />}

      {!docs.isLoading && rows.length === 0 && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
          <div>Base vide — ajoutez des documents internes pour que l'assistant puisse répondre et citer ses sources.{isSuperAdmin && <> <button className="btn btn-primary" style={{ padding: '4px 10px', marginLeft: 8 }} disabled={seed.isPending} onClick={() => seed.mutate()}>{seed.isPending ? 'Chargement…' : 'Charger des données de démo'}</button></>}</div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head"><h3>Poser une question</h3><span className="sub">{rows.length} document{rows.length > 1 ? 's' : ''} en base</span></div>
        <div className="card-pad">
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="field" style={{ flex: 1 }} value={q} onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send(); }} placeholder="Ex : procédure de validation des congés au-delà de 10 jours ?" aria-label="Question" />
            <button className="btn btn-primary" disabled={ask.isPending || !q.trim()} onClick={send}>{ask.isPending ? '…' : 'Demander'}</button>
          </div>
          <ErrBar error={ask.error} prefix="Base de connaissances indisponible." />

          {answer && (
            <div style={{ marginTop: 14 }}>
              <div className="msg"><div className="m-av ai">IA</div><div className="m-body" style={{ whiteSpace: 'pre-wrap' }}>{answer.text}</div></div>
              {answer.citations.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div className="section-t" style={{ marginTop: 0 }}>Sources citées</div>
                  {answer.citations.map((cit, i) => (
                    <div key={i} className="ref-row" style={{ alignItems: 'flex-start' }}>
                      <span className="chip on ref-w" style={{ marginRight: 8 }}>{cit.title}</span>
                      <span style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>« {cit.quote} »</span>
                    </div>
                  ))}
                </div>
              )}
              {answer.citations.length === 0 && <div style={{ fontSize: 12, color: 'var(--muted-2)', marginTop: 6 }}>Aucune citation — réponse hors base ou information non trouvée.</div>}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Documents de référence</h3></div>
        <div className="card-pad">
          {docs.isLoading && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Chargement…</div>}
          {rows.map((d, i) => (
            <div key={d.id} className="ref-row" style={i === rows.length - 1 ? { border: 'none' } : undefined}>
              <b style={{ fontSize: 13 }}>{d.title}</b>
              <span className="chip ref-w" style={{ marginLeft: 'auto' }}>{CAT_LABEL[d.category] ?? d.category}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="note" style={{ marginTop: 16 }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>Réponses ancrées dans les documents et citées (citations natives du modèle) — l'IA s'abstient si l'information n'est pas dans la base, et ne se substitue pas à un avis juridique.</div>
    </>
  );
}
