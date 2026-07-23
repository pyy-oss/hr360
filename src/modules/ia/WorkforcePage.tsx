import { Link } from 'react-router-dom';
import { Mini } from '@/components/mq';

const A: [string, number, string, string][] = [
  ['Besoin en profils cyber', 80, 'var(--signal-deep)', '+8'],
  ['Recrutement externe', 50, 'var(--signal)', '5'],
  ['Mobilité interne', 30, 'var(--gold)', '3'],
  ['Délai pour être prêt', 60, '#2C5468', '7 sem.'],
  ['Formations à lancer', 40, 'var(--muted-2)', '2'],
];
const B: [string, number, string, string][] = [
  ['Besoin en profils cyber', 30, 'var(--signal-deep)', '+3'],
  ['Recrutement externe', 20, 'var(--signal)', '1'],
  ['Mobilité interne', 20, 'var(--gold)', '2'],
  ['Délai pour être prêt', 35, '#2C5468', '4 sem.'],
  ['Formations à lancer', 20, 'var(--muted-2)', '1'],
];

export function WorkforcePage() {
  return (
    <>
      <div className="page-head">
        <h1>Workforce planning IA</h1>
        <p>Simuler les scénarios avant de décider : « et si l'on gagne l'appel d'offres ? » — l'IA calcule le besoin en talents, le mix recrutement / mobilité / formation, le coût et le délai.</p>
        <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>Module IA #39</span>
      </div>
      <div className="grid g2">
        <div className="cmp-col win">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div className="k-ic" style={{ width: 30, height: 30 }}><svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2}><path d="M20 6 9 17l-5-5" /></svg></div>
            <b>Scénario A — AO banque gagné</b>
          </div>
          {A.map((m) => <Mini key={m[0]} lab={m[0]} w={m[1]} bg={m[2]} val={m[3]} />)}
        </div>
        <div className="cmp-col">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div className="k-ic" style={{ width: 30, height: 30, background: 'var(--surface)', color: 'var(--muted)' }}><svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 8v8M8 12h8" /></svg></div>
            <b>Scénario B — croissance organique</b>
          </div>
          {B.map((m) => <Mini key={m[0]} lab={m[0]} w={m[1]} bg={m[2]} val={m[3]} />)}
        </div>
      </div>
      <div className="alert alert-warn" style={{ marginTop: 16 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
        <div>Le scénario A exige de lancer 3 recrutements dès maintenant pour tenir le délai. L'IA propose de <Link to="/agent" style={{ textDecoration: 'underline' }}>déclencher le copilote agentique →</Link></div>
      </div>
    </>
  );
}
