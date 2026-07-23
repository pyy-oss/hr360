import { useState } from 'react';
import { ErrBar } from '@/components/mq';
import { useAuth } from '@/auth/AuthProvider';
import { useSeedDemo } from '@/modules/absences/useLeave';
import { usePositions, type PositionRow } from '@/modules/recrutement/useRecrutement';
import { NewPositionForm } from '@/modules/recrutement/NewPositionForm';

const LEVEL_LABEL: Record<string, string> = {
  junior: 'Junior', confirme: 'Confirmé', senior: 'Senior', lead: 'Lead', manager: 'Manager',
};
const STATUS_LABEL: Record<string, string> = {
  ouvert: 'Ouvert', en_cours: 'En cours', pourvu: 'Pourvu', gele: 'Gelé', annule: 'Annulé',
};

function Weights({ w }: { w?: PositionRow['weights'] }) {
  if (!w) return null;
  return (
    <div className="weights">
      <div style={{ flex: w.technique, background: 'var(--signal-deep)' }}>Technique {w.technique} %</div>
      <div style={{ flex: w.experience, background: '#2C5468' }}>Expérience {w.experience} %</div>
      <div style={{ flex: w.soft, background: 'var(--gold)' }}>Soft {w.soft} %</div>
      <div style={{ flex: w.formation, background: '#7C8DA0' }}>Form. {w.formation} %</div>
    </div>
  );
}

export function PostesPage() {
  const { role } = useAuth();
  const positions = usePositions();
  const seed = useSeedDemo();
  const [selId, setSelId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const rows = positions.data ?? [];
  const sel = rows.find((p) => p.id === selId) ?? rows[0];
  const isSuperAdmin = role === 'super_admin';
  const canManage = ['super_admin', 'drh', 'rh', 'recruteur', 'manager'].includes(role ?? '');
  const empty = !positions.isLoading && rows.length === 0;

  return (
    <>
      <div className="page-head" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1>Postes &amp; référentiel</h1>
          <p>Le référentiel définit « en amont » ce que l'on cherche : compétences éliminatoires, pondérations, et critères explicitement exclus.</p>
        </div>
        {canManage && !showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14" /></svg>Nouveau poste
          </button>
        )}
      </div>

      {showForm && <NewPositionForm onDone={() => setShowForm(false)} />}

      <ErrBar error={positions.error} prefix="Chargement des postes impossible." />

      {empty && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
          <div>Aucun poste défini.{isSuperAdmin && <> <button className="btn btn-primary" style={{ padding: '4px 10px', marginLeft: 8 }} disabled={seed.isPending} onClick={() => seed.mutate()}>{seed.isPending ? 'Chargement…' : 'Charger des données de démo'}</button></>}</div>
        </div>
      )}

      {positions.isLoading && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Chargement…</div>}

      {rows.length > 0 && (
        <div className="grid g2" style={{ gridTemplateColumns: '260px 1fr', alignItems: 'start' }}>
          <div className="card">
            <div className="card-head"><h3>Ouvertures</h3><span className="sub">{rows.length}</span></div>
            {rows.map((p) => (
              <div key={p.id} className="cand" style={sel?.id === p.id ? { background: 'var(--signal-soft)' } : undefined} onClick={() => setSelId(p.id)}>
                <div style={{ flex: 1 }}>
                  <div className="c-name" style={{ fontSize: 13 }}>{p.title}</div>
                  <div className="c-meta">{LEVEL_LABEL[p.level] ?? p.level} · {p.openings} poste{p.openings > 1 ? 's' : ''}</div>
                </div>
                <span className={`chip${p.status === 'ouvert' ? ' on' : ''}`}>{STATUS_LABEL[p.status] ?? p.status}</span>
              </div>
            ))}
          </div>

          {sel && (
            <div className="card">
              <div className="card-head"><h3>{sel.title}</h3><span className="sub">{LEVEL_LABEL[sel.level] ?? sel.level} · {sel.contractType.toUpperCase()}</span></div>
              <div className="card-pad">
                <div className="section-t" style={{ marginTop: 0 }}>Pondérations globales du score</div>
                <Weights w={sel.weights} />
                <div className="grid g2" style={{ marginTop: 22, gap: 28 }}>
                  <div>
                    <div className="section-t" style={{ marginTop: 0 }}>Compétences éliminatoires</div>
                    {(sel.mustSkills ?? []).map((s) => (
                      <div key={s} className="ref-row"><span className="tag-must">MUST</span><span>{s}</span></div>
                    ))}
                    {(sel.mustSkills ?? []).length === 0 && <div style={{ fontSize: 12, color: 'var(--muted-2)' }}>—</div>}
                    <div className="section-t">Compétences valorisées</div>
                    {(sel.niceSkills ?? []).map((s) => (
                      <div key={s} className="ref-row"><span className="tag-nice">NICE</span><span>{s}</span></div>
                    ))}
                    {(sel.niceSkills ?? []).length === 0 && <div style={{ fontSize: 12, color: 'var(--muted-2)' }}>—</div>}
                  </div>
                  <div>
                    <div className="section-t" style={{ marginTop: 0 }}>Critères exclus du scoring</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {(sel.excludedCriteria ?? []).map((t) => <span key={t} className="tag-excl">{t.toUpperCase()}</span>)}
                      {(sel.excludedCriteria ?? []).length === 0 && <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>—</span>}
                    </div>
                    <div className="note" style={{ marginTop: 14 }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>Jamais lus par le moteur. Journalisé pour l'audit ARTCI.</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
