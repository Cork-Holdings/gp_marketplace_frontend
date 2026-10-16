import { useState, useEffect } from 'react';
import { userMessage } from '@/lib/userMessage';
import { Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/context/useAuth';
import { PasswordField } from '@/components/shared/PasswordField';

const SLIDES = [
  {
    title: 'One Platform to Grow Your African SME',
    body: 'Sell online, accept Mobile Money, and manage orders — all from a single merchant dashboard built for local businesses.',
  },
  {
    title: 'A Clearer Checkout Journey',
    body: 'Show customers their order total and payment status in one place. Mobile Money collection can be enabled once the gateway is configured.',
  },
  {
    title: 'Inventory & Analytics at a Glance',
    body: 'Update products, monitor sales revenue, and stay on top of every order from anywhere.',
  },
];

function GeepayLogo({ className = '' }) {
  return <img src="/brand/geepay-wordmark.png" alt="GeePay" width={1774} height={887} className={className} style={{width:128,height:64,objectFit:'contain',background:'#fff',borderRadius:6}} />;
}

function BrandPanel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return undefined;
    const timer = setInterval(() => setActive((i) => (i + 1) % SLIDES.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[active];

  return (
    <aside className="auth-brand-panel relative hidden flex-col justify-between overflow-hidden p-10 lg:flex lg:w-[42%] xl:p-12">
      <div className="auth-brand-glow pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="relative z-10">
        <GeepayLogo className="h-14 w-14" />
      </div>

      <div className="relative z-10 space-y-4">
        <h2 className="font-serif text-3xl font-medium leading-snug text-white xl:text-4xl">
          {slide.title}
        </h2>
        <p className="max-w-sm text-sm leading-relaxed text-white/70">{slide.body}</p>
      </div>

      <div className="relative z-10 flex gap-2" role="tablist" aria-label="Feature highlights">
        {SLIDES.map((_, i) => (
          <button
            key={SLIDES[i].title}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={`Slide ${i + 1}`}
            onClick={() => setActive(i)}
            className={`h-2 rounded-full transition-all ${
              i === active ? 'w-7 bg-cream' : 'w-2 bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
    </aside>
  );
}

export default function PortalLoginPage() {
  const { login, employeeLogin, isAuthenticated, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnLocation = location.state?.from;
  const from = returnLocation ? `${returnLocation.pathname}${returnLocation.search ?? ''}${returnLocation.hash ?? ''}` : '/portal';

  const [mode, setMode] = useState<'owner' | 'employee'>('owner');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setLocalError(null);
    try {
      if (mode === 'employee') {
        await employeeLogin({
          employee_number: employeeNumber.trim(),
          pin,
        });
      } else {
        await login(email, password);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setLocalError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = localError ? userMessage(localError) : error;

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4 py-8">
      <div className="flex w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-cream-dark">
        <BrandPanel />

        <main className="flex flex-1 flex-col px-6 py-8 sm:px-10 sm:py-10 lg:px-12">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <GeepayLogo className="h-9 w-9 lg:hidden" />
              <span className="font-serif text-lg font-semibold text-forest lg:hidden">Geepay</span>
            </Link>
            <p className="text-sm text-forest-muted">
              Back to{' '}
              <Link to="/" className="font-medium text-forest underline-offset-2 hover:underline">
                store
              </Link>
            </p>
          </div>

          {/* Form */}
          <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
            <div className="mb-8 text-center lg:text-left">
              <h1 className="text-2xl font-semibold text-charcoal sm:text-3xl">
                Welcome back to Geepay!
              </h1>
              <p className="mt-2 text-sm text-forest-muted">
                {mode === 'employee'
                  ? 'Enter your employee ID and PIN — no business code needed.'
                  : 'Customers, business owners and administrators sign in here with email and password.'}
              </p>
            </div>

            <div className="mb-6 flex rounded-xl border border-cream-dark p-1">
              <button
                type="button"
                className={`flex-1 rounded-lg py-2 text-sm font-medium ${mode === 'owner' ? 'bg-forest text-white' : 'text-forest-muted'}`}
                onClick={() => setMode('owner')}
              >
                Email & password
              </button>
              <button
                type="button"
                className={`flex-1 rounded-lg py-2 text-sm font-medium ${mode === 'employee' ? 'bg-forest text-white' : 'text-forest-muted'}`}
                onClick={() => setMode('employee')}
              >
                Employee PIN
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === 'owner' ? (
                <>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-charcoal">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-cream-dark bg-white px-4 py-3 text-sm text-charcoal placeholder:text-gray-400 focus:border-forest/40 focus:outline-none focus:ring-2 focus:ring-forest/15"
                />
              </div>

              <PasswordField
                id="password"
                label="Password"
                required
                value={password}
                onChange={setPassword}
                autoComplete="current-password"
                className="w-full rounded-xl border border-cream-dark bg-white px-4 py-3 text-sm text-charcoal placeholder:text-gray-400 focus:border-forest/40 focus:outline-none focus:ring-2 focus:ring-forest/15"
              />
                </>
              ) : (
                <>
                  <div>
                    <label htmlFor="employeeNumber" className="mb-1.5 block text-sm font-medium text-charcoal">
                      Employee ID
                    </label>
                    <input
                      id="employeeNumber"
                      required
                      inputMode="numeric"
                      pattern="\d{6}"
                      maxLength={6}
                      placeholder="123456"
                      value={employeeNumber}
                      onChange={(e) => setEmployeeNumber(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full rounded-xl border border-cream-dark bg-white px-4 py-3 text-sm font-mono tracking-widest text-charcoal focus:border-forest/40 focus:outline-none focus:ring-2 focus:ring-forest/15"
                    />
                  </div>
                  <div>
                    <label htmlFor="pin" className="mb-1.5 block text-sm font-medium text-charcoal">
                      PIN
                    </label>
                    <input
                      id="pin"
                      type="password"
                      required
                      inputMode="numeric"
                      pattern="\d{4,6}"
                      maxLength={6}
                      autoComplete="off"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full rounded-xl border border-cream-dark bg-white px-4 py-3 text-sm font-mono tracking-widest text-charcoal focus:border-forest/40 focus:outline-none focus:ring-2 focus:ring-forest/15"
                    />
                  </div>
                </>
              )}

              {displayError && !loading && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                  {displayError}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="auth-sign-in-btn flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
              >
                {submitting ? 'Signing in…' : 'Sign In'}
                {!submitting && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                )}
              </button>

              <p className="text-center text-sm text-forest-muted">
                {mode === 'owner' ? (
                  <>
                New business?{' '}
                <Link to="/register/merchant" className="font-medium text-forest underline-offset-2 hover:underline">
                  Register your business
                </Link>
                <span className="mt-3 block">New customer? <Link to="/register/customer" className="font-medium text-forest underline underline-offset-4">Create your account</Link></span>
                  </>
                ) : (
                  <>Sign in with your 6-digit employee ID and PIN.</>
                )}
              </p>
            </form>
          </div>

          {/* Footer */}
          <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-cream-dark pt-6 text-xs text-forest-muted">
            <span>© {new Date().getFullYear()} Geepay</span>
            <div className="flex gap-4">
              <a href="#privacy" className="hover:text-forest">Privacy Policy</a>
              <a href="#support" className="hover:text-forest">Support</a>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
