import { useMemo, useState } from 'react';
import { ErrBar, Field } from '@/components/mq';
import { usePositions } from './useRecrutement';
import { useDirectory } from '@/modules/collaborateurs/useCollaborateurs';
import { matchEmployeesToPosition, initials, scoreClass } from './useRecrutementFO';

const OPEN_STATUSES = ['ouvert', 'en_cours'];

export function MobilitePage() {
  const positions = usePositions();
  const directory = useDirectory();
  const [positionId, setPositionId] = useState('');

  const openPositions = (positions.data ?? []).filter((p) => OPEN_STATUSES.includes(p.status));
  const position = openPositions.find((p) => p.id === positionId);

  const matches = useMemo(
    () => (position ? matchEmployeesToPosition(position, directory.data ?? []) : []),
    [position, directory.data],
  );

  return (
    <>
      <div className="page-head">
        <h1>Mobilité interne</h1>
        <p>Avant de recruter à l'externe, l'outil rapproche les collaborateurs Neurones d'une ouverture de poste, sur la base du département et des compétences attendues. Aide à la décision — jamais un choix automatique.</p>
      </div>

      <ErrBar error={positions.error} prefix="Chargement des postes impossible." />
      <ErrBar error={directory.error} prefix="Chargement de l'annuaire impossible." />

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-pad">
          <Field label="Poste ouvert à pourvoir">
            <select className="field" value={positionId} onChange={(e) => setPositionId(e.target.value)}>
              <option value="">— choisir un poste —</option>
              {openPositions.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </Field>
          {!positions.isLoading && openPositions.length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 10 }}>Aucune ouverture de poste active.</div>
          )}
        </div>
      </div>

      {position && (
        <div className="card">
          <div className="card-head">
            <h3>Collaborateurs correspondants</h3>
            <span className="sub">{matches.length} profil{matches.length > 1 ? 's' : ''} · rapprochement interne</span>
          </div>
          {directory.isLoading && <div className="card-pad" style={{ fontSize: 13, color: 'var(--muted)' }}>Chargement…</div>}
          {!directory.isLoading && matches.length === 0 && (
            <div className="card-pad" style={{ fontSize: 13, color: 'var(--muted)' }}>Aucun collaborateur ne se rapproche de ce poste (département ou compétences). Un recrutement externe est probablement nécessaire.</div>
          )}
          {matches.map((m) => (
            <div key={m.employee.id} className="cand">
              <div className="c-av" style={{ background: 'var(--signal-soft)', color: 'var(--signal-deep)' }}>{initials(m.employee.firstName, m.employee.lastName)}</div>
              <div style={{ width: 210 }}>
                <div className="c-name">{m.employee.firstName} {m.employee.lastName}</div>
                <div className="c-meta">{m.employee.jobTitle}{m.sameDept && ' · même département'}</div>
              </div>
              <div className="c-mid" style={{ flex: 1 }}>
                {m.skillHits.slice(0, 4).map((s) => <span key={s} className="chip on" style={{ marginRight: 4 }}>{s}</span>)}
                {m.gaps.length > 0 && <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>gap : {m.gaps.slice(0, 3).join(', ')}</span>}
              </div>
              <span className={`score-badge ${scoreClass(m.score)}`}>{m.score} %</span>
            </div>
          ))}
        </div>
      )}

      <div className="note" style={{ marginTop: 16 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
        Rapprochement heuristique (département et mots-clés de l'intitulé de poste). Chaque écart de compétence est un axe de montée en compétences à confirmer avec le collaborateur — le recrutement interne devient un plan de formation ciblé.
      </div>
    </>
  );
}
