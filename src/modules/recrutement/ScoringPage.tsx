import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrBar, Field } from '@/components/mq';
import { useAuth } from '@/auth/AuthProvider';
import { usePositions, useCandidates } from './useRecrutement';
import { useScoreCandidate } from '@/modules/ia/useAi';

const SEG_W = [50, 25, 15, 10];
const SEG_BG = ['var(--signal-deep)', '#2C5468', 'var(--gold)', '#7C8DA0'];

function Meter({ fills, techBg }: { fills: number[]; techBg?: string }) {
  return (
    <div className="meter">
      {fills.map((f, i) => (
        <div key={i} className="seg" style={{ width: `${SEG_W[i]}%` }}>
          <div className="fill" style={{ width: `${f}%`, background: i === 0 ? (techBg ?? SEG_BG[0]) : SEG_BG[i] }} />
        </div>
      ))}
    </div>
  );
}

type Cand = {
  av: string; avStyle?: React.CSSProperties; name: string; flag?: JSX.Element; meta: string;
  fills: number[]; techBg?: string; why: string; badge: string; badgeTone: string;
};
const CANDS: Cand[] = [
  { av: 'AK', name: 'Aïcha Koné', flag: <span className="flag flag-reco">RECOMMANDÉ</span>, meta: '6 ans · OSCP', fills: [96, 88, 80, 100], why: 'Couvre 3/3 must-have · 6 ans pentest', badge: '89 %', badgeTone: 'sb-high' },
  { av: 'MD', name: 'Mamadou Diallo', flag: <span className="flag flag-reco">RECOMMANDÉ</span>, meta: '5 ans · CEH', fills: [84, 82, 78, 90], why: 'Fort en ISO · à confirmer : pentest', badge: '82 %', badgeTone: 'sb-high' },
  { av: 'FB', name: 'Fatou Bamba', meta: '4 ans · GRC', fills: [70, 74, 86, 100], why: 'Excellente conformité, plus faible en offensif', badge: '76 %', badgeTone: 'sb-high' },
  { av: 'IT', avStyle: { background: '#3A2A2A', color: '#C9A3A0' }, name: 'Ibrahim Touré', flag: <span className="flag flag-out">MUST-HAVE MANQUANT</span>, meta: '7 ans · réseau, sans sécurité offensive', fills: [30, 90, 70, 100], techBg: 'var(--low)', why: 'Écarté : 0/3 sur « tests d\'intrusion »', badge: '51 %', badgeTone: 'sb-low' },
];

const CAPS = [
  ['#5', 'Scoring adaptatif — affiné sur 47 décisions'],
  ['#6', 'Équivalences diplômes UEMOA / int.'],
  ['#7', 'Test technique auto-généré'],
  ['#8', 'Estimation coût & délai'],
];

const scoreClass = (s: number) => (s >= 80 ? 'sb-high' : s >= 60 ? 'sb-mid' : 'sb-low');

function LiveScoring() {
  const { role } = useAuth();
  const positions = usePositions();
  const candidates = useCandidates();
  const score = useScoreCandidate();
  const [positionId, setPositionId] = useState('');
  const [candidateId, setCandidateId] = useState('');
  const canScore = ['super_admin', 'drh', 'rh', 'recruteur', 'manager'].includes(role ?? '');
  if (!canScore) return null;
  const result = score.data;

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-head"><h3>Analyse IA d'un candidat</h3><span className="feat">Claude · aide à la décision</span></div>
      <div className="card-pad">
        <div className="form-grid">
          <Field label="Poste">
            <select className="field" value={positionId} onChange={(e) => setPositionId(e.target.value)}>
              <option value="">— choisir —</option>
              {(positions.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </Field>
          <Field label="Candidat">
            <select className="field" value={candidateId} onChange={(e) => setCandidateId(e.target.value)}>
              <option value="">— choisir —</option>
              {(candidates.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
            </select>
          </Field>
        </div>
        <ErrBar error={score.error} prefix="Scoring indisponible." />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
          <button className="btn btn-primary" disabled={!positionId || !candidateId || score.isPending}
            onClick={() => score.mutate({ candidateId, positionId })}>
            {score.isPending ? 'Analyse…' : 'Analyser l\'adéquation'}
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
              <div className="alert alert-info" style={{ fontSize: 12, marginTop: 8 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
                <div>Compétences éliminatoires non couvertes : {result.mustHaveGaps.join(', ')}</div>
              </div>
            )}
            <div className="note" style={{ marginTop: 10 }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>Aide à la décision : la sélection reste un choix humain. Analyse journalisée (gouvernance).</div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ScoringPage() {
  return (
    <>
      <div className="page-head">
        <h1>Analyse &amp; scoring</h1>
        <p>Classement des candidats par conformité au poste. Chaque score est <b>décomposable et explicable</b> — jamais une boîte noire.</p>
      </div>

      <LiveScoring />

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-pad" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--muted-2)', fontWeight: 600 }}>Capacités actives :</span>
          {CAPS.map(([n, txt]) => (
            <span key={n} className="chip on"><span className="feat" style={{ background: 'transparent', padding: 0 }}>{n}</span> {txt}</span>
          ))}
        </div>
      </div>

      <div className="grid g2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-head"><h3>Test technique auto-généré</h3><span className="feat">#7</span></div>
          <div className="card-pad">
            <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: 12 }}>Mini-challenge adapté au niveau, envoyé au candidat présélectionné. Synergie avec la brique Propulse.</div>
            <div className="qbox" style={{ marginBottom: 8 }}><div className="q-top"><span className="q-n">01</span><span className="q-txt">Analyse de logs : identifiez le vecteur d'intrusion dans cet extrait SIEM.</span></div><div className="q-meta"><span className="q-tag">Niveau confirmé</span><span className="q-tag">20 min</span></div></div>
            <div className="qbox" style={{ marginBottom: 0 }}><div className="q-top"><span className="q-n">02</span><span className="q-txt">Priorisez ces 5 vulnérabilités selon le risque métier.</span></div><div className="q-meta"><span className="q-tag">Cas pratique</span></div></div>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Coût &amp; délai estimés</h3><span className="feat">#8</span></div>
          <div className="card-pad">
            <div className="mini"><span className="m-lab">Rareté du profil</span><div className="m-track"><div className="mf" style={{ width: '78%', background: 'var(--mid)' }} /></div><span className="m-val">Élevée</span></div>
            <div className="mini"><span className="m-lab">Time-to-fill estimé</span><div className="m-track"><div className="mf" style={{ width: '60%', background: 'var(--signal)' }} /></div><span className="m-val">6-8 sem.</span></div>
            <div className="mini"><span className="m-lab">Coût de recrutement</span><div className="m-track"><div className="mf" style={{ width: '55%', background: '#2C5468' }} /></div><span className="m-val">Moyen</span></div>
            <div className="alert alert-info" style={{ marginTop: 12, fontSize: 12 }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 15v-5" /><path d="M12 8h.01" /></svg><div>Profil rare : la mobilité interne réduirait le délai de moitié. <Link to="/mobilite" style={{ textDecoration: 'underline' }}>Voir les profils internes →</Link></div></div>
          </div>
        </div>
      </div>

      <div className="legend" style={{ padding: '14px 20px', background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, marginBottom: 14 }}>
        <span><i style={{ background: 'var(--signal-deep)' }} />Technique · 50 %</span>
        <span><i style={{ background: '#2C5468' }} />Expérience · 25 %</span>
        <span><i style={{ background: 'var(--gold)' }} />Soft skills · 15 %</span>
        <span><i style={{ background: '#7C8DA0' }} />Formation · 10 %</span>
      </div>

      <div className="card">
        <div className="card-head"><h3>Candidats — Consultant Cybersécurité</h3><span className="sub">61 candidats · triés par score</span></div>
        {CANDS.map((c) => (
          <Link key={c.av} to="/profil" className="cand" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="c-av" style={c.avStyle}>{c.av}</div>
            <div>
              <div className="c-name">{c.name} {c.flag}</div>
              <div className="c-meta">{c.meta}</div>
            </div>
            <div className="c-mid c-meter">
              <Meter fills={c.fills} techBg={c.techBg} />
              <div className="cm-why">{c.why}</div>
            </div>
            <span className={`score-badge ${c.badgeTone}`}>{c.badge}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
