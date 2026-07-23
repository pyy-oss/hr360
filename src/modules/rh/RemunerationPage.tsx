import { useState } from 'react';
import { Mini, ErrBar } from '@/components/mq';
import { useAuth } from '@/auth/AuthProvider';
import { useEmployeesMap, useSeedDemo } from '@/modules/absences/useLeave';
import {
  useSalaryBands, useCompensations, useMyCompensation, type SalaryBandRow,
} from '@/modules/remuneration/useRemuneration';
import { NewCompensationForm } from '@/modules/remuneration/NewCompensationForm';
import { NewSalaryBandForm } from '@/modules/remuneration/NewSalaryBandForm';
import { money } from '@/modules/remuneration/money';

const LEVEL_ORDER = ['junior', 'confirme', 'senior', 'lead', 'manager'];
const bandColor = ['#7C8DA0', '#2C5468', 'var(--signal)', 'var(--signal-deep)', 'var(--gold)'];

function BandsCard({ bands, maxAmount }: { bands: SalaryBandRow[]; maxAmount: number }) {
  const sorted = [...bands].sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level));
  return (
    <>
      {sorted.map((b, i) => (
        <Mini key={b.id} lab={b.label} w={maxAmount ? Math.round((b.midAmount / maxAmount) * 100) : 0}
          bg={bandColor[i % bandColor.length]} val={money(b.midAmount, b.currency)} />
      ))}
    </>
  );
}

export function RemunerationPage() {
  const { role } = useAuth();
  const isStaff = ['super_admin', 'drh', 'rh'].includes(role ?? '');
  const isDrh = ['super_admin', 'drh'].includes(role ?? '');
  const bands = useSalaryBands();
  const comps = useCompensations();
  const mine = useMyCompensation();
  const emap = useEmployeesMap();
  const seed = useSeedDemo();
  const [showComp, setShowComp] = useState(false);
  const [showBand, setShowBand] = useState(false);

  // Vue collaborateur : uniquement sa propre rémunération.
  if (!isStaff) {
    const c = mine.data;
    return (
      <>
        <div className="page-head">
          <h1>Ma rémunération</h1>
          <p>Votre rémunération courante et sa date d'effet.</p>
        </div>
        <ErrBar error={mine.error} prefix="Chargement impossible." />
        <div className="card">
          <div className="card-head"><h3>Rémunération courante</h3></div>
          <div className="card-pad">
            {mine.isLoading && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Chargement…</div>}
            {!mine.isLoading && !c && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Aucune rémunération enregistrée.</div>}
            {c && (
              <>
                <div className="ref-row"><span>Salaire annuel brut</span><span className="ref-w" style={{ fontFamily: 'Inter', fontWeight: 600 }}>{money(c.baseSalary, c.currency)}</span></div>
                <div className="ref-row"><span>Palier</span><span className="ref-w">{c.bandLevel}</span></div>
                <div className="ref-row" style={{ border: 'none' }}><span>Date d'effet</span><span className="ref-w">{c.effectiveDate}</span></div>
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  const bs = bands.data ?? [];
  const cs = comps.data ?? [];
  const maxAmount = Math.max(1, ...bs.map((b) => b.maxAmount));
  const empty = !bands.isLoading && !comps.isLoading && bs.length === 0 && cs.length === 0;
  const isSuperAdmin = role === 'super_admin';

  return (
    <>
      <div className="page-head" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1>Rémunération</h1>
          <p>Grille par palier, rémunérations individuelles et traçabilité — la politique de rémunération pilotée avec cohérence.</p>
          <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>Module #32 · données réelles</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isDrh && !showBand && <button className="btn btn-ghost" onClick={() => { setShowBand(true); setShowComp(false); }}>Bande salariale</button>}
          {!showComp && <button className="btn btn-primary" onClick={() => { setShowComp(true); setShowBand(false); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>Rémunération</button>}
        </div>
      </div>

      {showBand && <NewSalaryBandForm onDone={() => setShowBand(false)} />}
      {showComp && <NewCompensationForm onDone={() => setShowComp(false)} />}

      <ErrBar error={bands.error} prefix="Chargement de la grille impossible." />
      <ErrBar error={comps.error} prefix="Chargement des rémunérations impossible." />

      {empty && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
          <div>Aucune grille ni rémunération.{isSuperAdmin && <> <button className="btn btn-primary" style={{ padding: '4px 10px', marginLeft: 8 }} disabled={seed.isPending} onClick={() => seed.mutate()}>{seed.isPending ? 'Chargement…' : 'Charger des données de démo'}</button></>}</div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head"><h3>Bandes salariales par palier</h3><span className="sub">salaire médian annuel brut</span></div>
        <div className="card-pad">
          {bands.isLoading && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Chargement…</div>}
          {!bands.isLoading && bs.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Aucune bande définie.</div>}
          <BandsCard bands={bs} maxAmount={maxAmount} />
          <div className="note" style={{ marginTop: 14 }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>Grille et rémunérations réservées à la RH/DRH. Chaque ajustement individuel est journalisé pour l'audit ARTCI.</div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Rémunérations individuelles</h3><span className="sub">{cs.length} collaborateur{cs.length > 1 ? 's' : ''}</span></div>
        <div className="card-pad">
          {comps.isLoading && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Chargement…</div>}
          {!comps.isLoading && cs.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Aucune rémunération enregistrée.</div>}
          {cs.map((c, i) => (
            <div key={c.id} className="ref-row" style={i === cs.length - 1 ? { border: 'none' } : undefined}>
              <div><b style={{ fontSize: 13 }}>{emap.data?.[c.employeeId] ?? c.employeeId}</b><div style={{ fontSize: 12, color: 'var(--muted-2)' }}>{c.bandLevel} · effet {c.effectiveDate}</div></div>
              <span className="ref-w" style={{ marginLeft: 'auto', fontFamily: 'Inter', fontWeight: 600 }}>{money(c.baseSalary, c.currency)}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
