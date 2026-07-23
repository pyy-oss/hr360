import { useRef, useState } from 'react';
import { ErrBar } from '@/components/mq';
import { useAuth } from '@/auth/AuthProvider';
import { useAssistant, type ChatTurn } from './useAi';

export function AssistantPage() {
  const { role } = useAuth();
  const ask = useAssistant();
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const initials = (role ?? 'moi').slice(0, 2).toUpperCase();
  const boxRef = useRef<HTMLDivElement>(null);

  const send = () => {
    const message = input.trim();
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
        <h1>Assistant RH interne</h1>
        <p>Un copilote conversationnel pour les managers et la RH — poser une question en langage naturel plutôt que fouiller les écrans.</p>
        <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>Couche IA · Claude</span>
      </div>

      <div className="note" style={{ marginBottom: 12 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
        L'assistant explique les processus et oriente dans l'outil ; il ne lit pas les données nominatives et ne prend aucune décision RH. Chaque échange est journalisé (gouvernance).
      </div>

      <div className="chat">
        <div ref={boxRef} style={{ maxHeight: '52vh', overflowY: 'auto' }}>
          {turns.length === 0 && (
            <div className="msg">
              <div className="m-av ai">IA</div>
              <div className="m-body">Bonjour 👋 Je peux vous aider sur les congés, la formation, les objectifs, le staffing, le recrutement… Posez votre question.</div>
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

        <ErrBar error={ask.error} prefix="Assistant indisponible." />

        <div className="chat-input">
          <input
            className="ci" style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: 'var(--text)' }}
            placeholder="Poser une question à l'assistant RH…" value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
            aria-label="Question à l'assistant RH"
          />
          <button className="btn btn-primary" disabled={ask.isPending || !input.trim()} onClick={send} aria-label="Envoyer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="m22 2-7 20-4-9-9-4z" /></svg>
          </button>
        </div>
      </div>
    </>
  );
}
