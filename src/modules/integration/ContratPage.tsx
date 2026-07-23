import { useState } from 'react';
import { ErrBar, Field } from '@/components/mq';
import { useAuth } from '@/auth/AuthProvider';
import { useDepartments, useUpsertEmployee } from '@/modules/collaborateurs/useCollaborateurs';
import { useStartOnboarding } from '@/modules/onboarding/useOnboarding';
import { useGenerateContent } from '@/modules/ia/useAi';
import type { EmployeeInput } from '@/types';

const SENIORITY = ['junior', 'confirme', 'senior', 'lead', 'manager'] as const;
const CONTRACTS = ['cdi', 'cdd', 'stage', 'alternance', 'prestation'] as const;

export function ContratPage() {
  const { role } = useAuth();
  const departments = useDepartments();
  const upsert = useUpsertEmployee();
  const startOnb = useStartOnboarding();
  const gen = useGenerateContent();

  const canHire = ['super_admin', 'drh', 'rh'].includes(role ?? '');
  const [f, setF] = useState({
    firstName: '', lastName: '', email: '', departmentId: '', jobTitle: '',
    seniorityLevel: 'confirme', contractType: 'cdi', hireDate: '',
  });
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));
  const [err, setErr] = useState<string | null>(null);
  const [hired, setHired] = useState<{ id: string; name: string; departmentId: string } | null>(null);

  const [brief, setBrief] = useState('');
  const [tone, setTone] = useState('formel');
  const [letter, setLetter] = useState('');

  const submitHire = () => {
    setErr(null);
    const input: Partial<EmployeeInput> = {
      firstName: f.firstName, lastName: f.lastName, email: f.email,
      departmentId: f.departmentId, jobTitle: f.jobTitle,
      seniorityLevel: f.seniorityLevel as EmployeeInput['seniorityLevel'],
      contractType: f.contractType as EmployeeInput['contractType'],
      hireDate: f.hireDate, status: 'essai',
    };
    upsert.mutate(input as EmployeeInput, {
      onSuccess: (res) => {
        const id = (res as { data?: { id?: string } }).data?.id;
        if (id) setHired({ id, name: `${f.firstName} ${f.lastName}`, departmentId: f.departmentId });
        setF({ firstName: '', lastName: '', email: '', departmentId: '', jobTitle: '', seniorityLevel: 'confirme', contractType: 'cdi', hireDate: '' });
      },
      onError: (e) => setErr((e as Error).message || 'Enregistrement impossible.'),
    });
  };

  const generateLetter = () => {
    setLetter('');
    gen.mutate(
      { kind: 'lettre_embauche', brief: brief || undefined, tone: tone as 'neutre' | 'chaleureux' | 'formel' },
      { onSuccess: (res) => setLetter((res as { data?: { text?: string } }).data?.text ?? '') },
    );
  };

  if (!canHire) {
    return (
      <>
        <div className="page-head"><h1>Contrat &amp; embauche</h1></div>
        <div className="note">L'enregistrement d'une embauche est réservé à la RH / DRH.</div>
      </>
    );
  }

  return (
    <>
      <div className="page-head">
        <h1>Contrat &amp; embauche</h1>
        <p>Enregistre une nouvelle recrue (créée en période d'essai), rédige un projet de lettre d'embauche et déclenche l'intégration.</p>
        <span className="feat" style={{ marginTop: 8, display: 'inline-block' }}>Données réelles</span>
      </div>

      {hired && (
        <div className="alert alert-ok" style={{ marginBottom: 16 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
          <div>
            <b>{hired.name}</b> enregistré(e) en période d'essai.{' '}
            <button className="btn btn-primary" style={{ padding: '4px 10px', marginLeft: 8 }} disabled={startOnb.isPending}
              onClick={() => {
                startOnb.mutate({ employeeId: hired.id, departmentId: hired.departmentId, startDate: new Date().toISOString().slice(0, 10) },
                  { onSuccess: () => setHired(null) });
              }}>
              {startOnb.isPending ? 'Démarrage…' : "Démarrer l'intégration"}
            </button>
          </div>
        </div>
      )}
      <ErrBar error={startOnb.error} prefix="Démarrage de l'intégration impossible (renseignez le département)." />

      <div className="grid g2">
        <div className="card">
          <div className="card-head"><h3>Enregistrer une embauche</h3></div>
          <div className="card-pad">
            {err && <div className="ferr" role="alert">{err}</div>}
            <div className="form-grid">
              <Field label="Prénom"><input className="field" value={f.firstName} onChange={(e) => set('firstName', e.target.value)} /></Field>
              <Field label="Nom"><input className="field" value={f.lastName} onChange={(e) => set('lastName', e.target.value)} /></Field>
              <Field label="Email"><input className="field" type="email" value={f.email} onChange={(e) => set('email', e.target.value)} /></Field>
              <Field label="Intitulé du poste"><input className="field" value={f.jobTitle} onChange={(e) => set('jobTitle', e.target.value)} /></Field>
              <Field label="Département">
                <select className="field" value={f.departmentId} onChange={(e) => set('departmentId', e.target.value)}>
                  <option value="">— choisir —</option>
                  {(departments.data ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </Field>
              <Field label="Séniorité">
                <select className="field" value={f.seniorityLevel} onChange={(e) => set('seniorityLevel', e.target.value)}>
                  {SENIORITY.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Type de contrat">
                <select className="field" value={f.contractType} onChange={(e) => set('contractType', e.target.value)}>
                  {CONTRACTS.map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                </select>
              </Field>
              <Field label="Date d'embauche"><input className="field" type="date" value={f.hireDate} onChange={(e) => set('hireDate', e.target.value)} /></Field>
            </div>
            <div style={{ marginTop: 12 }}>
              <button className="btn btn-primary" disabled={upsert.isPending} onClick={submitHire}>{upsert.isPending ? 'Enregistrement…' : "Enregistrer l'embauche"}</button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Projet de lettre d'embauche</h3><span className="sub">assistée</span></div>
          <div className="card-pad">
            <ErrBar error={gen.error} prefix="Génération indisponible." />
            <Field label="Éléments à intégrer (poste, rémunération, prise de fonction…)">
              <input className="field" value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="Consultant Cybersécurité, prise de fonction au 01/09, palier 4…" />
            </Field>
            <Field label="Ton">
              <select className="field" value={tone} onChange={(e) => setTone(e.target.value)}>
                <option value="formel">Formel</option>
                <option value="neutre">Neutre</option>
                <option value="chaleureux">Chaleureux</option>
              </select>
            </Field>
            <div style={{ marginTop: 10 }}>
              <button className="btn btn-primary" disabled={gen.isPending} onClick={generateLetter}>{gen.isPending ? 'Rédaction…' : 'Rédiger le projet'}</button>
            </div>
            {letter && (
              <div style={{ border: '1px solid var(--line)', borderRadius: 10, padding: 16, marginTop: 14, fontSize: '12.5px', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{letter}</div>
            )}
            <div className="note" style={{ marginTop: 14 }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>Brouillon d'aide à la rédaction : durées, clauses et mentions légales sont validées par la DRH / le juriste avant signature.</div>
          </div>
        </div>
      </div>
    </>
  );
}
