import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Signal, AlertTriangle } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { LoadingSpinner } from '../components/ui';

export function ProtectedRoute() {
  const { session, loading, initialized, configured } = useAuth();
  const location = useLocation();

  if (!configured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary p-6">
        <div className="max-w-md w-full rounded-xl border border-border bg-bg-secondary p-6 text-center">
          <AlertTriangle className="w-10 h-10 mx-auto text-amber-500" />
          <h1 className="mt-4 text-base font-semibold text-text-primary">Supabase is not configured</h1>
          <p className="mt-2 text-sm text-text-muted">
            Copy <code className="font-mono text-xs">.env.example</code> to{' '}
            <code className="font-mono text-xs">.env</code> and set{' '}
            <code className="font-mono text-xs">VITE_SUPABASE_URL</code> and{' '}
            <code className="font-mono text-xs">VITE_SUPABASE_ANON_KEY</code>, then restart the dev server.
          </p>
        </div>
      </div>
    );
  }

  if (loading && !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <LoadingSpinner />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export function AuthLoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-bg-primary">
      <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
        <Signal className="w-5 h-5 text-white" />
      </div>
      <LoadingSpinner />
    </div>
  );
}
