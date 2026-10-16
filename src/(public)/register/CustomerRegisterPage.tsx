import { userMessage } from '@/lib/userMessage';
import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '@/lib/api/services';
import { useAuth } from '@/lib/context/useAuth';
import { Button } from '@/components/ui/button';
import { PasswordField } from '@/components/shared/PasswordField';
import { WorkflowIcon } from '@/components/common/WorkflowIcon';
import { PhoneInput } from '@/components/shared/PhoneInput';
import { internationalPhone } from '@/lib/phone';

export default function CustomerRegisterPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [busy,setBusy] = useState(false);
  const submitting = useRef(false);
  const [error,setError] = useState('');
  const [password,setPassword] = useState('');
  const destination = params.get('next');
  const next = destination === '/account' || destination?.startsWith('/account/') ? destination : '/account';
  if (!auth.loading && auth.isAuthenticated) return <Navigate to={auth.isCustomer ? next : '/portal'} replace />;

  async function register(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const form = new FormData(event.currentTarget);
    form.set('password',password);
    const phone = String(form.get('phone') || '');
    if (phone) form.set('phone', internationalPhone(phone));
    submitting.current = true;setBusy(true);setError('');
    try {
      const result = await authApi.registerCustomer(form);
      await auth.loginFromResponse(result);
      navigate(next,{replace:true});
    } catch(cause) { setError(userMessage(cause, 'Could not create your account. Your details are still here; please try again.')); }
    finally { submitting.current = false;setBusy(false); }
  }

  return <main className="min-h-dvh bg-cream px-4 py-8 sm:py-14">
    <div className="mx-auto max-w-md">
      <Link to="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-forest"><span className="rotate-180"><WorkflowIcon name="arrowRight" /></span> Back to marketplace</Link>
      <section className="mt-5 rounded-2xl border border-cream-dark bg-white p-6 shadow-sm sm:p-8" aria-labelledby="signup-title">
        <p className="text-xs font-semibold uppercase tracking-widest text-forest-muted">Your GeePay account</p>
        <h1 id="signup-title" className="mt-3 text-2xl font-bold text-charcoal">Book, buy and keep track</h1>
        <p className="mt-2 text-sm leading-6 text-forest-muted">One account for bookings, estimates and orders. We reuse these details so you don't have to enter them for every request.</p>
        <form onSubmit={event => void register(event)} className="mt-6 space-y-5" aria-busy={busy}>
          <div><label htmlFor="signup-name" className="mb-2 block text-sm font-medium text-charcoal">Full name</label><input className="w-full rounded-xl border border-cream-dark px-3 py-3" id="signup-name" name="full_name" required maxLength={120} autoComplete="name" /></div>
          <div><label htmlFor="signup-email" className="mb-2 block text-sm font-medium text-charcoal">Email</label><input className="w-full rounded-xl border border-cream-dark px-3 py-3" id="signup-email" name="email" type="email" required maxLength={254} autoComplete="email" /></div>
          <div><label htmlFor="signup-phone" className="mb-2 block text-sm font-medium text-charcoal">Phone <span className="font-normal text-forest-muted">(optional)</span></label><PhoneInput className="w-full rounded-xl border border-cream-dark px-3 py-3" id="signup-phone" name="phone" hint="Used for contact and to prefill payments." /></div>
          <PasswordField id="signup-password" label="Password" value={password} onChange={setPassword} required autoComplete="new-password" className="w-full rounded-xl border border-cream-dark px-3 py-3" />
          <p className="text-xs text-forest-muted">Use at least 8 characters.</p>
          {error && <p role="alert" className="workflow-feedback is-error">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy || password.length < 8}>{busy ? 'Creating account…' : 'Create account'}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-forest-muted">Already have an account? <Link to="/login" className="font-semibold text-forest underline underline-offset-4">Sign in</Link></p>
      </section>
      <p className="mt-5 text-center text-sm text-forest-muted">Offering products or services? <Link to="/register/merchant" className="text-forest underline underline-offset-4">Register your business</Link></p>
    </div>
  </main>;
}
