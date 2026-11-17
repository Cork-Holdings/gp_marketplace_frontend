import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GeePayLogo } from '@/components/shared/GeePayLogo';
import { PasswordField } from '@/components/shared/PasswordField';
import { Button } from '@/components/ui/button';
import { authApi } from '@/lib/api/services';
import { ApiError } from '@/lib/api/crud';
import { useAuth } from '@/lib/context/useAuth';
import { userMessage } from '@/lib/userMessage';

const fieldClass = 'w-full rounded-xl border border-cream-dark bg-white px-4 py-3 text-sm text-charcoal focus:border-forest/40 focus:outline-none focus:ring-2 focus:ring-forest/15';

export default function PasswordRecoveryPage({ mode }: { mode: 'request' | 'reset' }) {
  const location = useLocation();
  const { logout } = useAuth();
  const [email, setEmail] = useState<string>(location.state?.email ?? '');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [invalidLink, setInvalidLink] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const requesting = mode === 'request';
  const token = new URLSearchParams(location.hash.slice(1)).get('token') ?? '';
  const needsNewLink = !requesting && !done && (invalidLink || !/^[\w-]{43}$/.test(token));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (!requesting) {
      if (password.length < 8 || new TextEncoder().encode(password).length > 72 || !password.trim()) {
        setError('Choose a password of at least 8 characters and at most 72 bytes.');
        return;
      }
      if (password !== confirmation) {
        setError('Your passwords do not match. Enter the same password in both fields.');
        return;
      }
    }
    setBusy(true);
    try {
      if (requesting) {
        await authApi.requestPasswordReset(email.trim());
      } else {
        await authApi.resetPassword(token, password);
        setPassword('');
        setConfirmation('');
      }
      setDone(true);
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === 'PASSWORD_RESET_INVALID') {
        setInvalidLink(true);
      } else {
        setError(userMessage(cause));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-cream px-4 py-8">
      <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-cream-dark sm:p-10" aria-labelledby="recovery-title">
        <GeePayLogo />
        <h1 id="recovery-title" className="mt-6 text-2xl font-semibold text-charcoal">
          {requesting ? 'Forgot password?' : 'Reset your password'}
        </h1>
        {done ? (
          <p role="status" className="mt-3 text-sm leading-relaxed text-forest-muted">
            {requesting
              ? 'If an active account uses that email, we’ll send a reset link. Check your inbox and spam folder.'
              : 'Your password has been updated. Sign in with your new password.'}
          </p>
        ) : needsNewLink ? (
          <div className="mt-3">
            <p role="alert" className="text-sm text-forest-muted">This reset link is invalid or has expired.</p>
            <Link to="/forgot-password" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-forest underline underline-offset-4">
              Request a new link
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-3 space-y-5" aria-busy={busy}>
            <p className="text-sm leading-relaxed text-forest-muted">
              {requesting ? 'Enter the email address you use to sign in to GeePay Marketplace.' : 'Choose a new password with at least 8 characters.'}
            </p>
            {requesting ? (
              <div>
                <label htmlFor="recovery-email" className="mb-1.5 block text-sm font-medium text-charcoal">Email</label>
                <input id="recovery-email" className={fieldClass} type="email" autoComplete="email" maxLength={254} value={email} onChange={event => setEmail(event.target.value)} required />
              </div>
            ) : (
              <>
                <PasswordField id="reset-password" label="New password" className={fieldClass} value={password} onChange={setPassword} required />
                <PasswordField id="confirm-password" label="Confirm new password" className={fieldClass} value={confirmation} onChange={setConfirmation} required />
              </>
            )}
            {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            <Button type="submit" disabled={busy} className="min-h-11 w-full">
              {requesting ? (busy ? 'Requesting…' : 'Send reset link') : (busy ? 'Saving…' : 'Save new password')}
            </Button>
          </form>
        )}
        <Link
          to="/login"
          replace={!requesting && done}
          onClick={!requesting && done ? logout : undefined}
          className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-forest underline underline-offset-4"
        >
          Back to sign in
        </Link>
      </section>
    </main>
  );
}
