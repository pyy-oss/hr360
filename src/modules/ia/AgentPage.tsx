import { useRef, useState } from 'react';
import { ErrBar } from '@/components/mq';
import { useAuth } from '@/auth/AuthProvider';
import { useAssistant, type ChatTurn } from './useAi';

const QUICK_ACTIONS: { label: string; prompt: string }[] = [
  { label: 'Politique de congés', prompt: 'Résume la politique de congés et le workflow de validation des demandes.' },
  { label: 'Lancer une campagne d\'objectifs', prompt: "Comment lancer une campagne annuelle de fixation d'objectifs et d'évaluation ? Détaille les étapes." },
  { label: 'Workflow d\'offboarding', prompt: "Explique le workflow d'offboarding et la checklist de sortie d'un collaborateur." },
  { label: 'Ouvrir un poste', prompt: 'Quelles sont les étapes pour ouvrir un poste et démarrer un recrutement dans HR 360 ?' },
  { label: 'Besoins de formation', prompt: 'Comment identifier et enregistrer les besoins de formation de mon équipe ?' },
];

export function AgentPage() {
  const { role } = useAuth();
  const ask = useAssistant();
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const initials = (role ?? 'moi').slice(0, 2).toUpperCase();
  const boxRef = useRef<HTMLDivElement>(null);

  const send = (raw?: string) => {
    const message = (raw ?? input).trim();
    if (!message || ask.isPending) return;
    const history = turns.slice(-12);
    setTurns((t) => [...t, { role: 'user', content: message }]);
    setInput('');
    ask.mutate({ message, history }, {
      onSuccess: (r) => {
        setTurns((t) => [...t, { role: 'assistant', content: r.text || '—' }]);
        setTimeout(() => boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight }), 50);
      },
    });
  };

  return (
    <>
      <div className="page-head">
        <h1>Copilote agentique</h1>
        <p>Un copilote conversationnel qui décompose une intention en étapes et vous oriente dans l'outil — vous pilotez, il explique et prépare.</p>
        <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>Couche IA · Claude</span>
      </div>

      <div className="note" style={{ marginBottom: 12 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
        Le copilote <b>ne prend aucune décision RH</b> et n'a pas accès aux données nominatives en direct : il explique les processus, oriente dans HR 360 et prépare des brouillons soumis à validation humaine. Chaque échange est journalisé (gouvernance).
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-head"><h3>Actions rapides</h3><span className="sub">prompts pré-remplis</span></div>
        <div className="card-pad" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.label}
              type="button"
              className="chip"
              style={{ cursor: 'pointer' }}
              disabled={ask.isPending}
              onClick={() => send(a.prompt)}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="chat">
        <div ref={boxRef} style={{ maxHeight: '48vh', overflowY: 'auto' }}>
          {turns.length === 0 && (
            <div className="msg">
              <div className="m-av ai">IA</div>
              <div className="m-body">Bonjour. Choisissez une action rapide ci-dessus ou posez votre question sur les congés, la formation, les objectifs, le staffing, le recrutement ou l'offboarding.</div>
            </div>
          )}
          {turns.map((t, i) => (
            <div key={i} className={`msg${t.role === 'user' ? ' u' : ''}`}>
              <div className={`m-av ${t.role === 'user' ? 'usr' : 'ai'}`}>{t.role === 'user' ? initials : 'IA'}</div>
              <div className="m-body" style={{ whiteSpace: 'pre-wrap' }}>{t.content}</div>
            </div>
          ))}
          {ask.isPending && (
            <div className="msg"><div className="m-av ai">IA</div><div className="m-body" style={{ color: 'var(--muted)' }}>…</div></div>
          )}
        </div>

        <ErrBar error={ask.error} prefix="Copilote indisponible." />

        <div className="chat-input">
          <input
            className="ci" style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: 'var(--text)' }}
            placeholder="Décrire une intention ou poser une question…" value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
            aria-label="Message au copilote"
          />
          <button className="btn btn-primary" disabled={ask.isPending || !input.trim()} onClick={() => send()} aria-label="Envoyer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="m22 2-7 20-4-9-9-4z" /></svg>
          </button>
        </div>
      </div>
    </>
  );
}
