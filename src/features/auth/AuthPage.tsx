import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Signal, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import { Button, Input } from '../../components/ui';

type Mode = 'signin' | 'signup';

export function AuthPage() {
  const { signIn, signUp, session, configured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || '/';

  const [mode, setMode] = useState<Mode>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (session) {
    return <Navigate to={from} replace />;
  }

  if (!configured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary p-6">
        <div className="max-w-md w-full rounded-xl border border-border bg-bg-secondary p-6 text-center">
          <AlertTriangle className="w-10 h-10 mx-auto text-amber-500" />
          <h1 className="mt-4 text-base font-semibold text-text-primary">Supabase is not configured</h1>
          <p className="mt-2 text-sm text-text-muted">
            Set <code className="font-mono text-xs">VITE_SUPABASE_URL</code> and{' '}
            <code className="font-mono text-xs">VITE_SUPABASE_ANON_KEY</code> in <code className="font-mono text-xs">.env</code>.
          </p>
        </div>
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password);
        navigate(from, { replace: true });
      } else {
        const { needsConfirmation } = await signUp(email.trim(), password, fullName.trim());
        if (needsConfirmation) {
          setNotice('Account created. Check your email to confirm your address, then sign in.');
          setMode('signin');
        } else {
          navigate(from, { replace: true });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center">
            <Signal className="w-6 h-6 text-white" />
          </div>
          <h1 className="mt-3 text-lg font-semibold text-text-primary">SignalDesk</h1>
          <p className="text-sm text-text-muted">Turn customer signals into better sales decisions.</p>
        </div>

        <div className="rounded-xl border border-border bg-bg-secondary p-6 shadow-sm">
          <div className="flex rounded-lg bg-bg-primary p-1 mb-5">
            {(['signin', 'signup'] as Mode[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setMode(value);
                  setError(null);
                  setNotice(null);
                }}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  mode === value ? 'bg-bg-surface text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {value === 'signin' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <Input
                label="Full name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Jane Cooper"
                autoComplete="name"
                required
                minLength={2}
              />
            )}
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
              minLength={8}
            />

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
            )}
            {notice && (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{notice}</p>
            )}

            <Button type="submit" className="w-full" loading={submitting} disabled={submitting}>
              {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-text-muted">
            New accounts receive the <span className="font-medium">sales_rep</span> role. An existing admin can promote
            you from Settings, or follow the manual SQL step in the README.
          </p>
        </div>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-text-muted">
          <Loader2 className="w-3 h-3" /> Secured by Supabase Auth + PostgreSQL RLS
        </p>
      </div>
    </div>
  );
}
