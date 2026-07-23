import { Mini, Kpi, ErrBar } from '@/components/mq';
import { useAuth } from '@/auth/AuthProvider';
import { useAuditFeed, useAiUsage, auditActionLabel } from '@/modules/dashboard/useMetrics';

const AI_FEATURE_LABEL: Record<string, string> = {
  aiAssistant: 'Assistant RH', scoreCandidate: 'Scoring candidat', generateContent: 'Studio de contenu',
  predictAttrition: 'Prédiction rétention', askKnowledge: 'Base de connaissances', analyzeSkills: 'Analyse compétences',
};
const featureLabel = (f: string) => AI_FEATURE_LABEL[f] ?? f;

const ARTCI: { title: string; sub: string }[] = [
  { title: 'Minimisation des données', sub: 'Seules les données strictement nécessaires sont collectées et conservées le temps légal.' },
  { title: 'Révision humaine', sub: 'Aucune décision RH n\'est prise par une IA : la couche IA reste une aide à la décision, tranchée par un humain.' },
  { title: 'Traçabilité', sub: 'Chaque action à impact et chaque appel IA sont journalisés (qui, quoi, quand) pour l\'audit ARTCI.' },
];

const fmtDate = (d: Date | null) => d ? d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

export function EquitePage() {
  const { role } = useAuth();
  const isGov = ['super_admin', 'drh'].includes(role ?? '');
  const audit = useAuditFeed(25);
  const ai = useAiUsage();

  if (!isGov) {
    return (
      <>
        <div className="page-head">
          <h1>Équité &amp; audit</h1>
          <p>Surveillance, explicabilité et conformité ARTCI.</p>
        </div>
        <div className="card"><div className="card-pad" style={{ fontSize: 13, color: 'var(--muted)' }}>Journal d'audit et gouvernance IA réservés à la DRH et à l'administration.</div></div>
      </>
    );
  }

  const usage = ai.data;
  const maxFeat = Math.max(1, ...(usage?.byFeature ?? []).map((f) => f.count));
  const auditRows = audit.data ?? [];

  return (
    <>
      <div className="page-head">
        <h1>Équité &amp; audit</h1>
        <p>La couche qui protège Neurones : traçabilité des actions, gouvernance de la couche IA et conformité ARTCI.</p>
        <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>Gouvernance · données réelles</span>
      </div>

      <ErrBar error={audit.error} prefix="Chargement du journal d'audit impossible." />
      <ErrBar error={ai.error} prefix="Chargement de l'usage IA impossible." />

      <div className="grid g4" style={{ marginBottom: 16 }}>
        <Kpi val={String(usage?.total ?? 0)} lab="Appels IA (100 derniers)"
          icon={<><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" /><path d="M12 6v6l4 2" /></>} />
        <Kpi val={usage && usage.successRate !== null ? `${usage.successRate} %` : '—'} lab="Taux de succès IA"
          deltaTone={usage && usage.successRate !== null && usage.successRate < 100 ? 'dn' : 'up'}
          delta={usage && usage.failCount > 0 ? `${usage.failCount} échec${usage.failCount > 1 ? 's' : ''}` : undefined}
          icon={<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></>} />
        <Kpi val={String((usage?.byFeature ?? []).length)} lab="Fonctionnalités IA actives"
          icon={<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>} />
        <Kpi val={String(auditRows.length)} lab="Événements audités"
          icon={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M9 15l2 2 4-4" /></>} />
      </div>

      <div className="grid g2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-head"><h3>Usage de la couche IA</h3><span className="sub">par fonctionnalité</span></div>
          <div className="card-pad">
            {ai.isLoading && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Chargement…</div>}
            {!ai.isLoading && (usage?.byFeature ?? []).length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Aucun appel IA journalisé pour le moment.</div>}
            {(usage?.byFeature ?? []).map((f, i) => (
              <Mini key={f.feature} lab={featureLabel(f.feature)} w={Math.round((f.count / maxFeat) * 100)}
                bg={i === 0 ? 'var(--signal-deep)' : 'var(--signal)'} val={String(f.count)} />
            ))}
            {usage && usage.models.length > 0 && (
              <div className="note" style={{ marginTop: 14 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" /></svg>
                Modèle{usage.models.length > 1 ? 's' : ''} : {usage.models.join(', ')}.
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Conformité ARTCI</h3></div>
          <div className="card-pad">
            {ARTCI.map((a, i) => (
              <div key={a.title} className="ref-row" style={i === ARTCI.length - 1 ? { border: 'none', alignItems: 'flex-start' } : { alignItems: 'flex-start' }}>
                <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="var(--high)" strokeWidth={2} style={{ marginTop: 2, flexShrink: 0 }} aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                <div style={{ marginLeft: 10 }}><b style={{ fontSize: 13 }}>{a.title}</b><div style={{ fontSize: 12, color: 'var(--muted)' }}>{a.sub}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Journal d'audit récent</h3><span className="sub">{auditRows.length} entrée{auditRows.length > 1 ? 's' : ''}</span></div>
        <div className="card-pad" style={{ paddingTop: 6 }}>
          {audit.isLoading && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Chargement…</div>}
          {!audit.isLoading && auditRows.length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>Aucune entrée d'audit. Le journal se remplit à mesure des actions à impact (décisions de congés, changements de rôle, clôtures…).</div>
          )}
          {auditRows.map((e) => (
            <div key={e.id} className="ref-row">
              <div>
                <b style={{ fontSize: '13px' }}>{auditActionLabel(e.action)} · {e.resource}{e.resourceId ? ` (${e.resourceId})` : ''}</b>
                <div style={{ fontSize: 12, color: 'var(--muted-2)' }}>{fmtDate(e.at)} · {e.actorUid}</div>
              </div>
              {e.actorRole && <span className="chip ref-w" style={{ marginLeft: 'auto', border: 'none', background: 'var(--signal-soft)', color: 'var(--signal-deep)' }}>{e.actorRole}</span>}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
