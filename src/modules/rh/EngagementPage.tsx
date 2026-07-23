import { useState } from 'react';
import { ErrBar } from '@/components/mq';
import { useAuth } from '@/auth/AuthProvider';
import { useSeedDemo } from '@/modules/absences/useLeave';
import { useSurveys } from '@/modules/engagement/useEngagement';
import { SurveyCard } from '@/modules/engagement/SurveyCard';
import { NewSurveyForm } from '@/modules/engagement/NewSurveyForm';

export function EngagementPage() {
  const { role } = useAuth();
  const surveys = useSurveys();
  const seed = useSeedDemo();
  const [showForm, setShowForm] = useState(false);

  const rows = surveys.data ?? [];
  const canManage = ['super_admin', 'drh', 'rh'].includes(role ?? '');
  const isSuperAdmin = role === 'super_admin';
  const empty = !surveys.isLoading && rows.length === 0;

  return (
    <>
      <div className="page-head" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1>Engagement &amp; climat</h1>
          <p>Écouter en continu pour agir tôt — enquêtes pulse anonymes et résultats agrégés, avant que la démotivation ne devienne un départ.</p>
          <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>Module #33 · données réelles</span>
        </div>
        {canManage && !showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>Nouvelle enquête
          </button>
        )}
      </div>

      {showForm && <NewSurveyForm onDone={() => setShowForm(false)} />}

      <ErrBar error={surveys.error} prefix="Chargement des enquêtes impossible." />

      {empty && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
          <div>Aucune enquête pour l'instant.{isSuperAdmin && <> <button className="btn btn-primary" style={{ padding: '4px 10px', marginLeft: 8 }} disabled={seed.isPending} onClick={() => seed.mutate()}>{seed.isPending ? 'Chargement…' : 'Charger des données de démo'}</button></>}</div>
        </div>
      )}

      <div className="note" style={{ marginBottom: 16 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
        Réponses strictement anonymes : identité et contenu sont stockés séparément côté serveur, et les moyennes sont masquées en dessous de 3 réponses.
      </div>

      {surveys.isLoading && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Chargement…</div>}
      {rows.map((s) => <SurveyCard key={s.id} survey={s} />)}
    </>
  );
}
