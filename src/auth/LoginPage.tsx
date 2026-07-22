import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Card, CardBody, Field, Input, Button } from '@/ui';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setBusy(true);
    try { await signInWithEmailAndPassword(auth, email.trim(), password); }
    catch { setError('Identifiants invalides. Réessayez.'); }
    finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink p-4">
      <Card className="w-full max-w-sm">
        <CardBody className="p-8">
          <div className="font-display font-semibold text-lg text-ink">Neurones HR 360</div>
          <p className="text-sm text-muted mb-6">Connexion à votre espace RH</p>
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Email professionnel">
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
            </Field>
            <Field label="Mot de passe" error={error ?? undefined}>
              <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </Field>
            <Button type="submit" disabled={busy} className="w-full justify-center">
              {busy ? 'Connexion…' : 'Se connecter'}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
